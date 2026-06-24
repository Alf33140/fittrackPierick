-- FitTrack Database Initialization
-- Session 1: Schema + Test Data

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

-- =============================================
-- TABLE: User
-- =============================================
CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT NULL COMMENT 'Weight in kg',
    goal ENUM('lose', 'maintain', 'gain') NOT NULL DEFAULT 'maintain',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: Exercise
-- =============================================
CREATE TABLE IF NOT EXISTS Exercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Musculation', 'Cardio', 'Flexibilité') NOT NULL,
    muscle_group VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: Workout
-- =============================================
CREATE TABLE IF NOT EXISTS Workout (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    duration INT DEFAULT NULL COMMENT 'Duration in minutes',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: WorkoutExercise
-- =============================================
CREATE TABLE IF NOT EXISTS WorkoutExercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT DEFAULT NULL,
    reps INT DEFAULT NULL,
    weight_used DECIMAL(6,2) DEFAULT NULL COMMENT 'Weight in kg',
    duration INT DEFAULT NULL COMMENT 'Duration in seconds for cardio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES Workout(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(id) ON DELETE RESTRICT
);

-- =============================================
-- TEST DATA: Exercises
-- =============================================
INSERT INTO Exercise (name, category, muscle_group, description) VALUES
-- Musculation
('Développé couché', 'Musculation', 'Pectoraux', 'Exercice de base pour les pectoraux, réalisé avec une barre ou des haltères allongé sur un banc.'),
('Squat', 'Musculation', 'Quadriceps, Fessiers', 'Exercice fondamental pour les jambes, debout avec barre sur les épaules ou au poids du corps.'),
('Soulevé de terre', 'Musculation', 'Dos, Ischio-jambiers, Fessiers', 'Exercice polyarticulaire de tirage au sol, excellent pour le développement du dos et des jambes.'),
('Tractions', 'Musculation', 'Dos, Biceps', 'Exercice au poids du corps suspendu à une barre, tirage vertical.'),
('Développé militaire', 'Musculation', 'Épaules, Triceps', 'Développé épaules avec barre ou haltères depuis la position debout ou assis.'),
('Curl biceps', 'Musculation', 'Biceps', 'Flexion du coude avec haltères ou barre pour isoler les biceps.'),
('Extension triceps', 'Musculation', 'Triceps', 'Extension du coude pour isoler les triceps, réalisable à la poulie ou avec haltère.'),
('Rowing barre', 'Musculation', 'Dos, Biceps', 'Tirage horizontal avec barre pour développer le dos et les biceps.'),
('Fentes', 'Musculation', 'Quadriceps, Fessiers, Ischio-jambiers', 'Exercice unijambiste pour les jambes, excellent pour la stabilité et l équilibre.'),
('Pompes', 'Musculation', 'Pectoraux, Triceps, Épaules', 'Exercice au poids du corps pour le haut du corps, réalisable partout.'),
-- Cardio
('Course à pied', 'Cardio', 'Corps entier', 'Exercice cardio fondamental, peut être réalisé en extérieur ou sur tapis de course.'),
('Vélo stationnaire', 'Cardio', 'Jambes, Corps entier', 'Cardio à faible impact articulaire, idéal pour une récupération active.'),
('Corde à sauter', 'Cardio', 'Corps entier, Coordination', 'Cardio intense qui améliore la coordination et brûle beaucoup de calories.'),
('Rameur', 'Cardio', 'Corps entier', 'Exercice cardio complet sollicitant le dos, les jambes et les bras.'),
('HIIT', 'Cardio', 'Corps entier', 'Entraînement par intervalles à haute intensité, alternance effort maximal et récupération.'),
-- Flexibilité
('Étirement ischio-jambiers', 'Flexibilité', 'Ischio-jambiers', 'Étirement statique des muscles à l arrière de la cuisse pour améliorer la mobilité.'),
('Yoga - Chien tête en bas', 'Flexibilité', 'Corps entier', 'Posture yoga classique qui étire les mollets, les ischio-jambiers et renforce les bras.'),
('Étirement des épaules', 'Flexibilité', 'Épaules, Dos supérieur', 'Étirement pour soulager les tensions au niveau des épaules et du haut du dos.'),
('Rotation du tronc', 'Flexibilité', 'Colonne vertébrale, Obliques', 'Mobilité de la colonne vertébrale, peut être réalisée assis ou debout.'),
('Foam roller dos', 'Flexibilité', 'Dos, Fascias', 'Auto-massage avec rouleau de mousse pour détendre les muscles du dos et les fascias.');