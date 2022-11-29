import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from 'i18next';
import en_US from './languages/en_US.json';
import zh_CN from './languages/zh_CN.json';
import { initReactI18next } from 'react-i18next';


i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en_US: {
                translation: en_US,
            },
            zh_CN: {
                translation: zh_CN,
            }
        },
        lng: "en_US",
        fallbackLng: "en_US",
        debug: false,
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
