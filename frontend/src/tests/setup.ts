//==================================================================
//tests/setup.ts / Configuration de l environnment de test Vitest
//
// Ce fichier est chargé AVANT chaque fichier de test frontend
//comme defini ds vitest.config.td (setupFiles: ['./src/tests/setup.ts']).
//==================================================================

// @testing-library/jest-dom ajoute des matchers personnalisés à expect() :
// - toBeInTheDocument() : vérifie que l element est ds le DOM
// - toHaveProperty() : vérifie la présence d une prop
// - toBeDisabled(): vérifie que l élément est désactivé
// - toHaveValue(): vérifie la valeur d'un input
// etc...
// sans cet import, ces matchers ne seraient pas disponibles ds les tests
import '@testing-library/jest-dom'
// Indique à React que l'environnement de test gère act() correctement.
// Sans ça, Vitest/jsdom peut désynchroniser le re-render déclenché par
// setState à l'intérieur de act(), et result.current reflète un état
// obsolète au moment de l'assertion.
declare global{
    var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true