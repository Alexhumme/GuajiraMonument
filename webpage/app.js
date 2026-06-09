// Archivo principal que orquesta todos los módulos
import { selOpt, updateSteps, submitForm, goBack } from './form.js';
import './firebase.js';

// Exponer funciones en el objeto global para que HTML las use
window.selOpt = selOpt;
window.updateSteps = updateSteps;
window.submitForm = submitForm;
window.goBack = goBack;
