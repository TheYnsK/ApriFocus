/**
 * Yalnızca izin verilen alanları içeren bir obje döndürür.
 * Bu, Mass Assignment saldırılarını önler.
 * @param {object} sourceObj - Filtrelenecek kaynak obje (ör: req.body).
 * @param {string[]} allowedFields - İzin verilen alan adlarının dizisi.
 * @returns {object} - Sadece izin verilen alanları içeren yeni obje.
 */
const pickAllowed = (sourceObj, allowedFields) => {
    const newObj = {};
    Object.keys(sourceObj).forEach(key => {
        if (allowedFields.includes(key)) {
            newObj[key] = sourceObj[key];
        }
    });
    return newObj;
};

// Todo'lar için izin verilen alanlar
const ALLOWED_TODO_FIELDS = [
    'title',
    'description',
    'priority',
    'dueDate',
    'imageUrl',
    'status',
    'isPinned',
    // Rutin güncellemeleri için
    'isRoutine',
    'routineDays',
    'routineType', // Bunu da ekledim (schema'da vardı)
    'reminderTime',
    'subtasks'     // Alt görevleri de ekledim
    // KRİTİK: role, userId, isMaster, masterRoutineId gibi alanlar ASLA eklenmemeli.
];

// Kullanıcı için izin verilen alanlar
const ALLOWED_USER_FIELDS = [
    'username',
    'avatar',
    'preferences' 
    // KRİTİK: role, xp, password, email gibi alanlar ASLA eklenmemeli (email değişimi ayrı süreçtir).
];

module.exports = {
    pickAllowed,
    ALLOWED_TODO_FIELDS,
    ALLOWED_USER_FIELDS
};