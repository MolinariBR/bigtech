"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_document";
exports.ids = ["pages/_document"];
exports.modules = {

/***/ "./src/pages/_document.tsx":
/*!*********************************!*\
  !*** ./src/pages/_document.tsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ MyDocument)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/document */ \"./node_modules/next/document.js\");\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_document__WEBPACK_IMPORTED_MODULE_1__);\n\n\n// Baseado em: 1.Project.md, 2.Architecture.md\n// Precedência: aplicar classe `dark` no documento antes da hidratação\n// Decisão: evitar mistura de temas (flash/theme-mix) aplicando classe no HTML no carregamento\nclass MyDocument extends (next_document__WEBPACK_IMPORTED_MODULE_1___default()) {\n    render() {\n        const setInitialTheme = `(function() {\n      try {\n        var theme = localStorage.getItem('theme');\n        if (theme === 'dark') {\n          document.documentElement.classList.add('dark');\n        } else if (!theme) {\n          // Detectar preferência do sistema apenas se não há tema salvo\n          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {\n            document.documentElement.classList.add('dark');\n          }\n        }\n        // Armazenar o tema inicial para o hook useTheme\n        window.__initialTheme = theme;\n      } catch (e) { }\n    })()`;\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Html, {\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Head, {\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                        dangerouslySetInnerHTML: {\n                            __html: setInitialTheme\n                        }\n                    }, void 0, false, {\n                        fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n                        lineNumber: 27,\n                        columnNumber: 11\n                    }, this)\n                }, void 0, false, {\n                    fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n                    lineNumber: 26,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"body\", {\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Main, {}, void 0, false, {\n                            fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n                            lineNumber: 30,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.NextScript, {}, void 0, false, {\n                            fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n                            lineNumber: 31,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n                    lineNumber: 29,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"/home/mau/projeto/consulta/frontend-admin/src/pages/_document.tsx\",\n            lineNumber: 25,\n            columnNumber: 7\n        }, this);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2RvY3VtZW50LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBc0U7QUFFdEUsOENBQThDO0FBQzlDLHNFQUFzRTtBQUN0RSw4RkFBOEY7QUFDL0UsTUFBTUssbUJBQW1CTCxzREFBUUE7SUFDOUNNLFNBQVM7UUFDUCxNQUFNQyxrQkFBa0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7UUFjckIsQ0FBQztRQUVMLHFCQUNFLDhEQUFDTiwrQ0FBSUE7OzhCQUNILDhEQUFDQywrQ0FBSUE7OEJBQ0gsNEVBQUNNO3dCQUFPQyx5QkFBeUI7NEJBQUVDLFFBQVFIO3dCQUFnQjs7Ozs7Ozs7Ozs7OEJBRTdELDhEQUFDSTs7c0NBQ0MsOERBQUNSLCtDQUFJQTs7Ozs7c0NBQ0wsOERBQUNDLHFEQUFVQTs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJbkI7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL2Zyb250ZW5kLWFkbWluLy4vc3JjL3BhZ2VzL19kb2N1bWVudC50c3g/MTg4ZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRG9jdW1lbnQsIHsgSHRtbCwgSGVhZCwgTWFpbiwgTmV4dFNjcmlwdCB9IGZyb20gJ25leHQvZG9jdW1lbnQnXG5cbi8vIEJhc2VhZG8gZW06IDEuUHJvamVjdC5tZCwgMi5BcmNoaXRlY3R1cmUubWRcbi8vIFByZWNlZMOqbmNpYTogYXBsaWNhciBjbGFzc2UgYGRhcmtgIG5vIGRvY3VtZW50byBhbnRlcyBkYSBoaWRyYXRhw6fDo29cbi8vIERlY2lzw6NvOiBldml0YXIgbWlzdHVyYSBkZSB0ZW1hcyAoZmxhc2gvdGhlbWUtbWl4KSBhcGxpY2FuZG8gY2xhc3NlIG5vIEhUTUwgbm8gY2FycmVnYW1lbnRvXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNeURvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xuICByZW5kZXIoKSB7XG4gICAgY29uc3Qgc2V0SW5pdGlhbFRoZW1lID0gYChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciB0aGVtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0aGVtZScpO1xuICAgICAgICBpZiAodGhlbWUgPT09ICdkYXJrJykge1xuICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdkYXJrJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoZW1lKSB7XG4gICAgICAgICAgLy8gRGV0ZWN0YXIgcHJlZmVyw6puY2lhIGRvIHNpc3RlbWEgYXBlbmFzIHNlIG7Do28gaMOhIHRlbWEgc2Fsdm9cbiAgICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyayknKS5tYXRjaGVzKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZGFyaycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBBcm1hemVuYXIgbyB0ZW1hIGluaWNpYWwgcGFyYSBvIGhvb2sgdXNlVGhlbWVcbiAgICAgICAgd2luZG93Ll9faW5pdGlhbFRoZW1lID0gdGhlbWU7XG4gICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICB9KSgpYFxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxIdG1sPlxuICAgICAgICA8SGVhZD5cbiAgICAgICAgICA8c2NyaXB0IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogc2V0SW5pdGlhbFRoZW1lIH19IC8+XG4gICAgICAgIDwvSGVhZD5cbiAgICAgICAgPGJvZHk+XG4gICAgICAgICAgPE1haW4gLz5cbiAgICAgICAgICA8TmV4dFNjcmlwdCAvPlxuICAgICAgICA8L2JvZHk+XG4gICAgICA8L0h0bWw+XG4gICAgKVxuICB9XG59XG4iXSwibmFtZXMiOlsiRG9jdW1lbnQiLCJIdG1sIiwiSGVhZCIsIk1haW4iLCJOZXh0U2NyaXB0IiwiTXlEb2N1bWVudCIsInJlbmRlciIsInNldEluaXRpYWxUaGVtZSIsInNjcmlwdCIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiX19odG1sIiwiYm9keSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/pages/_document.tsx\n");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./src/pages/_document.tsx")));
module.exports = __webpack_exports__;

})();