import SwiftUI
import WebKit
import UniformTypeIdentifiers

struct WebView: UIViewRepresentable {

    class Coordinator: NSObject, WKUIDelegate, WKScriptMessageHandler, UIDocumentPickerDelegate {

        weak var webView: WKWebView?

        // JS confirm() panels (WKWebView needs an explicit UI delegate for these)
        func webView(_ webView: WKWebView,
                     runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo,
                     completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .destructive) { _ in completionHandler(true) })
            guard let top = Coordinator.topViewController() else { completionHandler(false); return }
            top.present(alert, animated: true)
        }

        // JS → native bridge. Two message channels:
        //   backup     — window.webkit.messageHandlers.backup.postMessage(jsonString)
        //   importFile — window.webkit.messageHandlers.importFile.postMessage('')
        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            switch message.name {
            case "backup":
                guard let json = message.body as? String else { return }
                presentShareSheet(json: json)
            case "importFile":
                presentDocumentPicker()
            default:
                break
            }
        }

        // Export: write JSON to a dated temp file and open the iOS share sheet so the
        // user can "Save to Files" (iCloud Drive / On My iPhone) — survives app deletion.
        private func presentShareSheet(json: String) {
            let stamp = ISO8601DateFormatter().string(from: Date()).prefix(10) // YYYY-MM-DD
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("gym-backup-\(stamp).json")
            do { try json.data(using: .utf8)?.write(to: url, options: .atomic) }
            catch { return }

            guard let top = Coordinator.topViewController() else { return }
            let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            if let pop = av.popoverPresentationController {
                pop.sourceView = top.view
                pop.sourceRect = CGRect(x: top.view.bounds.midX, y: top.view.bounds.midY, width: 0, height: 0)
                pop.permittedArrowDirections = []
            }
            top.present(av, animated: true)
        }

        // Import: open the Files picker for a backup JSON.
        private func presentDocumentPicker() {
            guard let top = Coordinator.topViewController() else { return }
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.json, .plainText])
            picker.delegate = self
            picker.allowsMultipleSelection = false
            top.present(picker, animated: true)
        }

        func documentPicker(_ controller: UIDocumentPickerViewController,
                            didPickDocumentsAt urls: [URL]) {
            guard let url = urls.first else { return }
            // Files may live outside the sandbox — request scoped access to read.
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let content = try? String(contentsOf: url, encoding: .utf8) else { return }
            sendImportToJS(content)
        }

        // Hand the file text back to the web layer. Wrapping in a JSON array gives a
        // safely-escaped JS string literal regardless of quotes/newlines/unicode.
        private func sendImportToJS(_ content: String) {
            guard let data = try? JSONSerialization.data(withJSONObject: [content]),
                  let arg = String(data: data, encoding: .utf8) else { return }
            let js = "window.__importFromNative && window.__importFromNative(\(arg)[0])"
            webView?.evaluateJavaScript(js)
        }

        // Topmost presented controller — so we never present on a VC that's already presenting.
        static func topViewController() -> UIViewController? {
            guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let root = (scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first)?.rootViewController
            else { return nil }
            var top = root
            while let presented = top.presentedViewController { top = presented }
            return top
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "backup")
        config.userContentController.add(context.coordinator, name: "importFile")

        let webView = WKWebView(frame: .zero, configuration: config)
        context.coordinator.webView = webView
        webView.uiDelegate = context.coordinator
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.06, green: 0.06, blue: 0.06, alpha: 1)
        // Resolve index.html wherever it landed in the bundle (blue folder "web",
        // a differently-named subfolder, or flat in the root). Read access is
        // granted to its parent folder so it can load sibling JS/CSS.
        if let url = WebView.webIndexURL() {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            // Nothing found → the web assets aren't in the bundle at all.
            // Dump what IS there so we can see (check Xcode console).
            print("⚠️ index.html NOT found in bundle.")
            print("resourceURL:", Bundle.main.resourceURL?.path ?? "nil")
            if let res = Bundle.main.resourceURL,
               let items = try? FileManager.default.contentsOfDirectory(atPath: res.path) {
                print("bundle top-level items:", items)
            }
        }
        return webView
    }

    // Tries the expected "web" subfolder, then the bundle root, then a recursive
    // search — so it works regardless of how the assets were added to the target.
    static func webIndexURL() -> URL? {
        if let u = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") { return u }
        if let u = Bundle.main.url(forResource: "index", withExtension: "html") { return u }
        if let res = Bundle.main.resourceURL,
           let en = FileManager.default.enumerator(at: res, includingPropertiesForKeys: nil) {
            for case let f as URL in en where f.lastPathComponent == "index.html" { return f }
        }
        return nil
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea()
            .background(Color(red: 0.06, green: 0.06, blue: 0.06))
    }
}
