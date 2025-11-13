const mod = await import('docx-templates');
console.log('keys', Object.keys(mod));
console.log('default type', typeof mod.default);
