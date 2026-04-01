function InitColorSchemeScript() {
  const script = `try{var s=localStorage.getItem('theme');if(s==='dark'||(s===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default InitColorSchemeScript;
