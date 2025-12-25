"use strict";(()=>{var e={};e.id=660,e.ids=[660],e.modules={1070:(e,r,t)=>{t.r(r),t.d(r,{default:()=>d});var s=t(997),a=t(6859),i=t.n(a);class d extends i(){render(){let e=`(function() {
      try {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (!theme) {
          // Detectar prefer\xeancia do sistema apenas se n\xe3o h\xe1 tema salvo
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
        }
        // Armazenar o tema inicial para o hook useTheme
        window.__initialTheme = theme;
      } catch (e) { }
    })()`;return(0,s.jsxs)(a.Html,{children:[s.jsx(a.Head,{children:s.jsx("script",{dangerouslySetInnerHTML:{__html:e}})}),(0,s.jsxs)("body",{children:[s.jsx(a.Main,{}),s.jsx(a.NextScript,{})]})]})}}},2785:e=>{e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},6689:e=>{e.exports=require("react")},997:e=>{e.exports=require("react/jsx-runtime")},5315:e=>{e.exports=require("path")}};var r=require("../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[567,859],()=>t(1070));module.exports=s})();