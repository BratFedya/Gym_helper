// i18n.js — localization layer. Loaded FIRST (before store/ui/views/app).
// Classic script (shared global scope), not an ES module — WKWebView blocks
// module fetches on file:// origins.

const LANG_KEY = 'gym_lang';

// ─── i18n ───────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const TRANSLATIONS = {
  en: {
    // Muscles
    'muscle.biceps': 'Biceps', 'muscle.triceps': 'Triceps', 'muscle.shoulders': 'Shoulders',
    'muscle.pecs': 'Pecs', 'muscle.lats': 'Lats', 'muscle.rhomboids': 'Rhomboids',
    'muscle.trapezius': 'Trapezius', 'muscle.abs': 'Abs', 'muscle.obliques': 'Obliques',
    'muscle.lower_back': 'Lower Back', 'muscle.glutes': 'Glutes', 'muscle.hamstrings': 'Hamstrings',
    'muscle.quads': 'Quads', 'muscle.calves': 'Calves',
    // Muscle groups
    'group.arms': 'Arms', 'group.chest': 'Chest', 'group.back': 'Back',
    'group.core': 'Core', 'group.legs': 'Legs',
    // Tabs / titles
    'tab.exercises': 'Exercises', 'tab.workouts': 'Workouts',
    // Exercises list
    'exercises.empty.title': 'No exercises yet',
    'exercises.empty.body': 'Tap + to add your first exercise.',
    // Add / edit exercise
    'exercise.new': 'New Exercise', 'exercise.edit': 'Edit Exercise', 'exercise.one': 'Exercise',
    'field.name': 'Name', 'field.category': 'Category', 'field.description': 'Description',
    'field.date': 'Date',
    'ph.name': 'e.g. Bench Press', 'ph.name2': 'e.g. Pull-ups',
    'ph.desc': 'Sets, reps, tips, notes…', 'ph.desc2': 'Sets, reps, tips…',
    'btn.save': 'Save Exercise', 'btn.cancel': 'Cancel', 'btn.edit': 'Edit', 'btn.back': 'Back',
    'btn.saveChanges': 'Save Changes', 'btn.delete': 'Delete',
    'btn.deleteExercise': 'Delete Exercise',
    'exercise.noDesc': 'No description added.',
    'exercise.added': 'Added {date}',
    'chart.title': 'Weight History',
    'chart.empty': 'No weight data for this period.',
    'chart.one': '{kg} kg — only one session recorded in this period.',
    // Workouts list
    'workouts.empty.title': 'No workouts yet',
    'workouts.empty.body': 'Tap + to log your first workout session.',
    'workout.new': 'New Workout',
    'btn.createWorkout': 'Create Workout',
    'btn.generateByGroup': 'Generate by Muscle Group',
    'workout.noExercises': 'No exercises',
    'workout.noExercisesYet': 'No exercises yet',
    'workout.buildHint': 'Tap "Add Exercise" to build this workout.',
    'btn.addExercise': '+ Add Exercise',
    'btn.startWorkout': 'Start Workout',
    'btn.deleteWorkout': 'Delete Workout',
    'addex.title': 'Add Exercise',
    'addex.fromList': 'From your list',
    'addex.createNew': 'Create new exercise',
    'btn.createAndAdd': 'Create & Add to Workout',
    // Generate
    'gen.title': 'Generate Workout',
    'gen.muscleGroups': 'Muscle Groups',
    'gen.btn': 'Generate', 'gen.regenerate': 'Regenerate',
    'gen.noMatch.title': 'No exercises match',
    'gen.noMatch.body': 'Add exercises tagged with the selected muscle groups first.',
    'gen.count': 'Generated · {n} {ex}',
    'gen.onlyFound': 'Only {n} found — add more exercises to reach 5.',
    // Active
    'active.hint': 'Mark each exercise as done when you finish your set.',
    'btn.done': 'Done', 'btn.noWeight': 'No weight', 'btn.saveShort': 'Save',
    'btn.finishWorkout': 'Finish Workout',
    'active.last': 'Last: {v}', 'unit.bw': 'BW', 'unit.kg': 'kg',
    'popup.saved': 'Workout Saved!',
    // Confirms
    'confirm.deleteExercise': 'Delete "{name}"?',
    'confirm.deleteWorkout': 'Delete this workout?',
    'confirm.discardWorkout': 'Discard this workout? The exercises you added will be lost.',
    'confirm.leaveWorkout': 'Leave workout? Progress will be lost.',
    'confirm.replaceBackup': 'Replace all data with this backup ({ex} exercises, {w} workouts)? Your current data will be overwritten.',
    'confirm.replaceFile': 'Replace all data with this file ({ex} exercises, {w} workouts)? Your current data will be overwritten.',
    'btn.replace': 'Replace', 'btn.ok': 'OK',
    // Dates
    'date.today': 'Today', 'date.yesterday': 'Yesterday',
    // Count words
    'count.exercise': ['exercise', 'exercises'],
    'count.workout': ['workout', 'workouts'],
    'count.nExercises': '{n} {ex}',
    // Settings / backup
    'settings.title': 'Backup',
    'settings.language': 'Language',
    'settings.export': 'Export',
    'settings.exportHint': '{ex} · {w}. Copy this text and keep it somewhere safe — Notes, an email to yourself, etc. Paste it back under Import to restore.',
    'btn.copy': 'Copy to Clipboard', 'btn.copied': 'Copied ✓',
    'btn.copySelected': 'Selected — tap Copy on the menu',
    'btn.exportFile': 'Export to a File…',
    'btn.onlyInApp': 'Only available inside the iOS app',
    'settings.import': 'Import',
    'settings.importHint': 'Pick a backup file from Files, or paste one below. This replaces everything currently in the app.',
    'btn.importFile': 'Import from a File…',
    'ph.pasteBackup': '…or paste backup JSON here',
    'btn.importReplace': 'Import & Replace All Data',
    'import.pasteFirst': 'Paste a backup first.',
    'import.invalidJson': 'Invalid JSON — make sure you pasted the whole backup.',
    'import.notBackup': "This doesn't look like a Gym Helper backup.",
  },
  ru: {
    'muscle.biceps': 'Бицепс', 'muscle.triceps': 'Трицепс', 'muscle.shoulders': 'Плечи',
    'muscle.pecs': 'Грудь', 'muscle.lats': 'Широчайшие', 'muscle.rhomboids': 'Ромбовидные',
    'muscle.trapezius': 'Трапеция', 'muscle.abs': 'Пресс', 'muscle.obliques': 'Косые',
    'muscle.lower_back': 'Поясница', 'muscle.glutes': 'Ягодицы', 'muscle.hamstrings': 'Бицепс бедра',
    'muscle.quads': 'Квадрицепс', 'muscle.calves': 'Икры',
    'group.arms': 'Руки', 'group.chest': 'Грудь', 'group.back': 'Спина',
    'group.core': 'Кор', 'group.legs': 'Ноги',
    'tab.exercises': 'Упражнения', 'tab.workouts': 'Тренировки',
    'exercises.empty.title': 'Пока нет упражнений',
    'exercises.empty.body': 'Нажмите +, чтобы добавить первое упражнение.',
    'exercise.new': 'Новое упражнение', 'exercise.edit': 'Редактировать', 'exercise.one': 'Упражнение',
    'field.name': 'Название', 'field.category': 'Категория', 'field.description': 'Описание',
    'field.date': 'Дата',
    'ph.name': 'напр. Жим лёжа', 'ph.name2': 'напр. Подтягивания',
    'ph.desc': 'Подходы, повторы, заметки…', 'ph.desc2': 'Подходы, повторы, советы…',
    'btn.save': 'Сохранить', 'btn.cancel': 'Отмена', 'btn.edit': 'Правка', 'btn.back': 'Назад',
    'btn.saveChanges': 'Сохранить изменения', 'btn.delete': 'Удалить',
    'btn.deleteExercise': 'Удалить упражнение',
    'exercise.noDesc': 'Описание не добавлено.',
    'exercise.added': 'Добавлено {date}',
    'chart.title': 'История веса',
    'chart.empty': 'Нет данных о весе за этот период.',
    'chart.one': '{kg} кг — за этот период только одна тренировка.',
    'workouts.empty.title': 'Пока нет тренировок',
    'workouts.empty.body': 'Нажмите +, чтобы записать первую тренировку.',
    'workout.new': 'Новая тренировка',
    'btn.createWorkout': 'Создать тренировку',
    'btn.generateByGroup': 'Сгенерировать по группам мышц',
    'workout.noExercises': 'Нет упражнений',
    'workout.noExercisesYet': 'Пока нет упражнений',
    'workout.buildHint': 'Нажмите «Добавить упражнение», чтобы собрать тренировку.',
    'btn.addExercise': '+ Добавить упражнение',
    'btn.startWorkout': 'Начать тренировку',
    'btn.deleteWorkout': 'Удалить тренировку',
    'addex.title': 'Добавить упражнение',
    'addex.fromList': 'Из вашего списка',
    'addex.createNew': 'Создать новое упражнение',
    'btn.createAndAdd': 'Создать и добавить',
    'gen.title': 'Сгенерировать тренировку',
    'gen.muscleGroups': 'Группы мышц',
    'gen.btn': 'Сгенерировать', 'gen.regenerate': 'Ещё раз',
    'gen.noMatch.title': 'Нет подходящих упражнений',
    'gen.noMatch.body': 'Сначала добавьте упражнения с выбранными группами мышц.',
    'gen.count': 'Сгенерировано · {n} {ex}',
    'gen.onlyFound': 'Найдено только {n} — добавьте ещё упражнений, чтобы было 5.',
    'active.hint': 'Отмечайте упражнение выполненным, когда закончите подход.',
    'btn.done': 'Готово', 'btn.noWeight': 'Без веса', 'btn.saveShort': 'Сохранить',
    'btn.finishWorkout': 'Завершить тренировку',
    'active.last': 'Прошлый: {v}', 'unit.bw': 'СВ', 'unit.kg': 'кг',
    'popup.saved': 'Тренировка сохранена!',
    'confirm.deleteExercise': 'Удалить «{name}»?',
    'confirm.deleteWorkout': 'Удалить эту тренировку?',
    'confirm.discardWorkout': 'Отменить тренировку? Добавленные упражнения будут потеряны.',
    'confirm.leaveWorkout': 'Выйти из тренировки? Прогресс будет потерян.',
    'confirm.replaceBackup': 'Заменить все данные этой копией ({ex} упр., {w} трен.)? Текущие данные будут перезаписаны.',
    'confirm.replaceFile': 'Заменить все данные этим файлом ({ex} упр., {w} трен.)? Текущие данные будут перезаписаны.',
    'btn.replace': 'Заменить', 'btn.ok': 'OK',
    'date.today': 'Сегодня', 'date.yesterday': 'Вчера',
    'count.exercise': ['упражнение', 'упражнения', 'упражнений'],
    'count.workout': ['тренировка', 'тренировки', 'тренировок'],
    'count.nExercises': '{n} {ex}',
    'settings.title': 'Резервная копия',
    'settings.language': 'Язык',
    'settings.export': 'Экспорт',
    'settings.exportHint': '{ex} · {w}. Скопируйте этот текст и сохраните в надёжном месте — Заметки, письмо себе и т.п. Вставьте обратно в разделе «Импорт», чтобы восстановить.',
    'btn.copy': 'Скопировать', 'btn.copied': 'Скопировано ✓',
    'btn.copySelected': 'Выделено — нажмите «Копировать» в меню',
    'btn.exportFile': 'Экспорт в файл…',
    'btn.onlyInApp': 'Доступно только внутри приложения iOS',
    'settings.import': 'Импорт',
    'settings.importHint': 'Выберите файл копии из «Файлов» или вставьте её ниже. Это заменит все данные в приложении.',
    'btn.importFile': 'Импорт из файла…',
    'ph.pasteBackup': '…или вставьте JSON копии сюда',
    'btn.importReplace': 'Импортировать и заменить всё',
    'import.pasteFirst': 'Сначала вставьте копию.',
    'import.invalidJson': 'Некорректный JSON — убедитесь, что вставили копию целиком.',
    'import.notBackup': 'Это не похоже на копию Gym Helper.',
  },
};

function getLang() {
  const l = localStorage.getItem(LANG_KEY);
  return (l === 'en' || l === 'ru') ? l : 'ru';
}
function setLang(lang) { localStorage.setItem(LANG_KEY, lang); }

// Russian plural: forms = [one, few, many]; English: [one, many]
function plural(n, forms, lang = getLang()) {
  if (lang === 'ru') {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return forms[1];
    return forms[2];
  }
  return n === 1 ? forms[0] : forms[1];
}

// Translate a key; interpolates {name} placeholders from params.
function t(key, params = {}) {
  const lang = getLang();
  let s = TRANSLATIONS[lang][key];
  if (s === undefined) s = TRANSLATIONS.en[key];
  if (s === undefined) return key;
  if (Array.isArray(s)) return s; // used by plural()
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}

// "3 exercises" / "3 упражнения" — count + correctly-declined word.
function countLabel(n, kind) {
  const word = plural(n, t('count.' + kind), getLang());
  return t('count.nExercises', { n, ex: word });
}
