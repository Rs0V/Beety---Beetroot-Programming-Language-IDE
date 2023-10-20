
const customEvents = {
    copenfolder: new Event('copenfolder'),

    cnewfile:    new Event('cnewfile'),
    csavefile:   new Event('csavefile'),
    csaveall:    new Event('csaveall'),
 
    cexitapp:    new Event('cexitapp'),
 
    cundo:       new Event('cundo'),
    credo:       new Event('credo'),
 
    ccutline:    new Event('ccutline'),
    ccopyline:   new Event('ccopyline'),
    cpasteline:  new Event('cpasteline'),
 
    cfind:       new Event('cfind'),
    creplace:    new Event('creplace'),
 
    ccomment:    new Event('ccomment'),
 
    cterminal:   new Event('cterminal'),
 
    cbtrtdoc:    new Event('cbtrtdoc'),
    cabout:      new Event('cabout'),
};
class Shortcut {
    constructor(mod1, mod2, key, event, eventFunc) {
        this.mod1 = mod1;
        this.mod2 = mod2;
        this.key  = key;
        this.event  = event;
        this.eventFunc = eventFunc;
    }
}
const modKeysCheck = {
    Ctrl:     false,
    Shift:    false,
    Alt:      false,
    CheckKey: function(key) {
        switch (key) {
            case 'Control':
            case 'Ctrl':
                return this.Ctrl;
            case 'Shift':
                return this.Shift;
            case 'Alt':
                return this.Alt;
            default:
                return true;
        }
    }
}
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'Control':
            modKeysCheck.Ctrl = true;
            break;
        case 'Shift':
            modKeysCheck.Shift = true;
            break;
        case 'Alt':
            modKeysCheck.Alt = true;
            break;
    }
});
window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'Control':
            modKeysCheck.Ctrl = false;
            break;
        case 'Shift':
            modKeysCheck.Shift = false;
            break;
        case 'Alt':
            modKeysCheck.Alt = false;
            break;
    }
});

//---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { ipcRenderer, shell } = require('electron');
const { spawn } = require('child_process');

let mainWinMax = false;

let openFolder = null;
let Files = [];
let openFile = null;


let prereqs = 'E:/Visual Studio Projects/Beetroot-Prereqs/Beetroot-Prereqs/Beetroot-Prereqs.cpp';
let pyBtrtFile = 'E:/VS Code Projects/1/Beetroot Programming Language/main.py';
let btrtCompiler = 'E:/VS Code Projects/1/Beetroot Programming Language/dist/main/main.exe';
let useBtrtCompiler = false;

if (window.localStorage.getItem('btrtPath'))
    btrtCompiler = window.localStorage.getItem('btrtPath');

if (window.localStorage.getItem('useBtrt'))
    useBtrtCompiler = (window.localStorage.getItem('useBtrt') === 'true');

if (window.localStorage.getItem('btrtPyPath'))
    pyBtrtFile = window.localStorage.getItem('btrtPyPath');

if (window.localStorage.getItem('prereqsPath'))
    prereqs = window.localStorage.getItem('prereqsPath');




function saveFile() {
    fs.writeFile(Files[openFile].path, document.querySelector('#coding-space').value, (err) => {
        if (err)
            console.log("Couldn't modify file: " + err.message);
        else
            console.log(`File "${Files[openFile].name}${path.extname(Files[openFile].path)}" modified successfully!`);
    });
}
function saveAllFiles() {
    saveFile();
    Files.forEach((file, index) => {
        if (index !== openFile) {
            fs.writeFile(file.path, file.contents, (err) => {
                if (err)
                    console.log(`Couldn't modify file "${file.name}": ` + err.message);
                else
                    console.log(`File "${file.name}${path.extname(file.path)}" modified successfully!`);
            });
        }
    });
}




//--------------
// APP WINDOW
//--------------
window.addEventListener('load', () => {
    if (document.body.id !== 'index')
        return;

    const codeSpace = document.querySelector('#coding-space');
    codeSpace.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault();

            const start = codeSpace.selectionStart;
            const end = codeSpace.selectionEnd;
        
            // set textarea value to: text before caret + tab + text after caret
            codeSpace.value = codeSpace.value.slice(0, start) + '\t' + codeSpace.value.slice(end);
        
            // put caret at right position again
            codeSpace.selectionStart = codeSpace.selectionEnd = start + 1;
        }
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((elem) => {
        elem.style.height = getComputedStyle(elem).width;
    });

    const tbIconedElements = [document.querySelector('#app-logo-container'),
        document.querySelector('#settings-btn'),
        document.querySelector('#min-btn'),
        document.querySelector('#max-btn'),
        document.querySelector('#close-btn')
    ];
    tbIconedElements.forEach((elem) => {
        elem.style.width = getComputedStyle(elem).height;
        elem.style.minWidth = getComputedStyle(elem).height;
    });

    const cp = document.querySelector('#context-panel');
    cp.style.display = 'none';

    const filesButton = document.querySelector('#files-btn');
    filesButton.addEventListener('click', () => {
        const defAnim = getComputedStyle(cp).animation;
        const app = document.querySelector('#app');
        if (cp.style.display === 'none') {
            cp.style.display = '';
            app.style.gridTemplateAreas = `
                "tb tb tb"
                "sp cp cs"
                "sp cp t"
            `;
        }
        else {
            cp.classList.remove('slide-in');
            void cp.offsetHeight;
            cp.classList.add('slide-out');
            
            setTimeout(() => {
                cp.style.display = 'none';
                cp.classList.remove('slide-out');
                void cp.offsetHeight;
                cp.classList.add('slide-in');

                app.style.gridTemplateAreas = `
                    "tb tb tb"
                    "sp cs cs"
                    "sp t t"
                `;
            }, parseFloat(getComputedStyle(cp).animationDuration.slice(0, -1)) * 1000);
        }
    });

    const runBtn = document.querySelector('#run-btn');
    runBtn.addEventListener('click', () => {
        if (path.extname(Files[openFile].path) != '.btrt')
            return;

        // RUN BEETROOT COMPILER
        const python = spawn('python', [`"${pyBtrtFile}"`], {
            shell: true
        });

        // COMMENT EITHER ONE TO SWITCH BETWEEN PYTHON AND BEETROOT RESPECTIVELY
        let btrt = null;
        if (useBtrtCompiler === false)
            btrt = python;
        else
            btrt = spawn(btrtCompiler);

        btrt.stdin.write(`btrt -p ${prereqs}\n`);
        btrt.stdin.write(`btrt -c ${Files[openFile].path}\n`);

        btrt.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);

            if(data.includes('code 0')) {
                // RUN G++ COMPILER
                const cppFilePath = Files[openFile].path.slice(0, Files[openFile].path.lastIndexOf('.')) + '.cpp';
                const exeFilePath = Files[openFile].path.slice(0, Files[openFile].path.lastIndexOf('.'));

                const gpp = spawn('g++', [`"${cppFilePath}" -o "${exeFilePath}"`], {
                    shell: true
                });

                gpp.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                gpp.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });

                gpp.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);

                    // RUN COMPILED EXECUTABLE
                    shell.openPath(exeFilePath + '.exe');
                });
            }
        });

        btrt.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        btrt.stdin.write('exit\n');
    });

    const closeBtn = document.querySelector('#close-btn');
    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('closeApp');
    });
    const maxBtn = document.querySelector('#max-btn');
    maxBtn.addEventListener('click', () => {
        if (mainWinMax === false) {
            ipcRenderer.send('maxApp');
            mainWinMax = true;
        }
        else {
            ipcRenderer.send('unmaxApp');
            mainWinMax = false;
        }
    });
    const minBtn = document.querySelector('#min-btn');
    minBtn.addEventListener('click', () => {
        ipcRenderer.send('minApp');
    });
    const settingsBtn = document.querySelector('#settings-btn');
    settingsBtn.addEventListener('click', () => {
        ipcRenderer.send('openSettings');
    });

    const text = [...document.querySelectorAll('textarea')]
        .concat([...document.querySelectorAll('span')])
        .concat([...document.querySelectorAll('input[type="text"]')]);
    text.forEach((item) => {
        item.ondragstart = () => {
            return false;
        }
    });

    const menuBtns = [...document.querySelectorAll('.tb-btn')].slice(0, 4);
    const menuLists = [...document.querySelectorAll('.menu-lists')];
    menuBtns.forEach((elem, index) => {
        elem.addEventListener('click', () => {
            let visible = false;
            if (menuLists[index].getAttribute('data-visible')) {
                visible = (menuLists[index].getAttribute('data-visible') === 'true');
            }
            setTimeout(() => {
                if (visible === false) {
                    menuLists[index].style.display = 'block';
                    menuLists[index].style.top = `${elem.getBoundingClientRect().top +
                        parseFloat(getComputedStyle(elem).height.slice(0, -2)) +
                        10}px`;
                    menuLists[index].style.left = `${elem.getBoundingClientRect().left}px`;

                    menuLists[index].setAttribute('data-visible', 'true');
                }
                else {
                    menuLists[index].style.display = '';
                    menuLists[index].setAttribute('data-visible', 'false');
                }
            }, 1);
        });
    });

    const menuListsBtns = [...document.querySelectorAll('.menu-lists > li')];
    const menuListsBtnNames = [...document.querySelectorAll('.menu-lists > li > span:first-child')];
    menuListsBtns.forEach((elem, index) => {
        elem.id = `menu-${menuListsBtnNames[index].innerText.toLowerCase().replace(' ', '-')}`;
    });

    const openFolderBtn = document.querySelector('#menu-open-folder');
    openFolderBtn.addEventListener('click', () => {
        ipcRenderer.send('getOpenFolder');
        ipcRenderer.on('openFolder', (event, folderPath) => {
            openFolder = folderPath;
            console.log(openFolder);

            let mainFiles = null;
            try {
                mainFiles = fs.readdirSync(openFolder);
                console.log(mainFiles);
            } catch (err) {
                console.log(`Unable to scan directory: ${err}`);
            }
    
            const cpBody = document.querySelector('#cp-body');
            while (cpBody.firstChild) {
                cpBody.removeChild(cpBody.lastChild);
            }
    
            const btrtFileImg = document.createElement('img');
            btrtFileImg.src = '../assets/Beety(icon)-fin.ico';
            btrtFileImg.style.height = '70%';

            const fileImg = document.createElement('img');
            fileImg.src = '../assets/Files-Icon-v3.1.png';
            fileImg.style.height = '70%';
    
            const dirImg = document.createElement('img');
            dirImg.src = '../assets/Plus-Sign-v1.png';
            dirImg.style.height = '70%';
    
            const fileName = document.createElement('div');
            fileName.style.display = 'flex';

            fileName.style.height = '100%';
            fileName.style.marginLeft = '8px';

            const spanFileName = document.createElement('span');
            spanFileName.style.margin = 'auto';

            spanFileName.style.fontSize = '14px';
            spanFileName.style.fontWeight = '400';
            spanFileName.style.fontFamily = "'Source Code Pro', monospace";
            spanFileName.style.color = 'rgb(217, 100, 123)';
    
            const fileDiv = document.createElement('div');
            fileDiv.style.display = 'flex';
            fileDiv.style.alignItems = 'center';
            fileDiv.style.justifyContent = 'flex-start';
            fileDiv.style.gap = '4px';

            fileDiv.style.width = '90%';
            fileDiv.style.height = '24px';

            fileDiv.style.cursor = 'pointer';
    
            Files = [];
            mainFiles.forEach((file) => {
                const fdiv = fileDiv.cloneNode();
                const fname = fileName.cloneNode();
                const sfname = spanFileName.cloneNode();
                const fimg = fileImg.cloneNode();
                const bImg = btrtFileImg.cloneNode();
                const dImg = dirImg.cloneNode();
                
                const filePath = path.join(openFolder, file);
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    const extension = path.extname(file);
                    if (extension === '.btrt')
                        fdiv.appendChild(bImg);
                    else
                        fdiv.appendChild(fimg);
                }
                else {
                    fdiv.appendChild(dImg);
                }

                sfname.textContent = file;
                fname.appendChild(sfname);
                fdiv.appendChild(fname);

                if (stat.isFile() && path.extname(filePath) != '.cpp' && path.extname(filePath) != '.exe') {
                    try {
                        Files.push({
                            name: file.slice(0, file.lastIndexOf('.')),
                            path: filePath,
                            contents: fs.readFileSync(filePath, 'utf8')
                        });
                    } catch (err) {
                        console.log(`Couldn't read file: ${err}`);
                    }
                }
                const fileIndex = Files.length - 1;
                fdiv.addEventListener('click', () => {
                    if (stat.isFile()) {
                        if (openFile != null) {
                            Files[openFile].contents = codeSpace.value;
                        }
                        openFile = fileIndex;
                        codeSpace.value = Files[openFile].contents;
                    }
                });

                if (!stat.isFile() || stat.isFile() && path.extname(filePath) != '.cpp' && path.extname(filePath) != '.exe')
                    cpBody.appendChild(fdiv);
            });
        });
    });

    const newFileFunc = () => {
        fs.writeFile(path.join(openFolder, 'file.txt'), '', (err) => {
            if (err)
                console.log("Couldn't create file: " + err.message);
            else
                console.log('File created successfully!');
        });
    };
    document.querySelector('#create-file').addEventListener('click', newFileFunc);
    document.querySelector('#menu-new-file').addEventListener('click', newFileFunc);

    document.querySelector('#menu-save').addEventListener('click', () => { saveFile(); });
    document.querySelector('#menu-save-all').addEventListener('click', () => { saveAllFiles(); });

    document.querySelector('#menu-exit').addEventListener('click', () => { ipcRenderer.send('closeApp'); });
});



window.addEventListener('click', (event) => {
    const menuLists = [...document.querySelectorAll('.menu-lists')];
    menuLists.forEach((elem) => {
        elem.style.display = '';
        elem.setAttribute('data-visible', 'false');
    });
});



//-------------------
// SETTINGS WINDOW
//-------------------
window.addEventListener('load', () => {
    if (document.body.id !== 'settings')
        return;

    const tbIconedElements = [document.querySelector('#win-logo-container'),
        document.querySelector('#min-btn'),
        document.querySelector('#max-btn'),
        document.querySelector('#close-btn')
    ];
    tbIconedElements.forEach((elem) => {
        elem.style.width = getComputedStyle(elem).height;
        elem.style.minWidth = getComputedStyle(elem).height;
    });

    const closeBtn = document.querySelector('#close-btn');
    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('closeSettings');
    });
    const maxBtn = document.querySelector('#max-btn');
    maxBtn.addEventListener('click', () => {
        if (mainWinMax === false) {
            ipcRenderer.send('maxSettings');
            mainWinMax = true;
        }
        else {
            ipcRenderer.send('unmaxSettings');
            mainWinMax = false;
        }
    });
    const minBtn = document.querySelector('#min-btn');
    minBtn.addEventListener('click', () => {
        ipcRenderer.send('minSettings');
    });

    const panelBtns = [...document.querySelectorAll('#side-panel > ul > li > input[type="button"]')];
    const panels = [...document.querySelectorAll('#main-panel > div')];
    panels.forEach((elem) => {
        elem.style.display = 'none';
    });
    panels[0].style.display = '';
    panelBtns.forEach((elem, index) => {
        elem.addEventListener('click', () => {
            panels.forEach((p) => {
                p.style.display = 'none';
            });
            panels[index].style.display = '';
        });
    });

    const btrtPath = document.querySelector('#btrt-path');
    const useBtrt = document.querySelector('#use-btrt');
    const btrtPyPath = document.querySelector('#btrt-py-path');
    const prereqsPath = document.querySelector('#prereqs-path');

    if (window.localStorage.getItem('btrtPath'))
        btrtPath.value = window.localStorage.getItem('btrtPath');
    else
        btrtPath.value = btrtCompiler;

    if (window.localStorage.getItem('useBtrt'))
        useBtrt.checked = (window.localStorage.getItem('useBtrt') === 'true');
    else
        useBtrt.checked = useBtrtCompiler;

    if (window.localStorage.getItem('btrtPyPath'))
        btrtPyPath.value = window.localStorage.getItem('btrtPyPath');
    else
        btrtPyPath.value = pyBtrtFile;

    if (window.localStorage.getItem('prereqsPath'))
        prereqsPath.value = window.localStorage.getItem('prereqsPath');
    else
        prereqsPath.value = prereqs;

    btrtPath.addEventListener('keydown', () => {
        window.localStorage.setItem('btrtPath', btrtPath.value);
    });
    useBtrt.addEventListener('click', () => {
        window.localStorage.setItem('useBtrt', useBtrt.checked);
    });
    btrtPyPath.addEventListener('keydown', () => {
        window.localStorage.setItem('btrtPyPath', btrtPyPath.value);
    });
    prereqsPath.addEventListener('keydown', () => {
        window.localStorage.setItem('prereqsPath', prereqsPath.value);
    });
});



//--------------------
// SHORTCUTS CHECKS
//--------------------
let appShortCuts = [new Shortcut('Ctrl', null, 's', customEvents.csavefile),
    new Shortcut('Ctrl', null, 'q', customEvents.cexitapp)];
window.addEventListener('keydown', (event) => {
    if (event.repeat === false) {
        console.log(`Ctrl: ${modKeysCheck.Ctrl},    Shift: ${modKeysCheck.Shift},    Alt: ${modKeysCheck.Alt}`)
        appShortCuts.forEach((shortcut) => {
            if (modKeysCheck.CheckKey(shortcut.mod1) &&
                modKeysCheck.CheckKey(shortcut.mod2) &&
                event.key === shortcut.key) {
                dispatchEvent(shortcut.event);
            }
        });
    }
});
window.addEventListener(customEvents.csavefile.type, () => {
    if (document.body.id !== 'index')
        return;
    saveFile();
});
window.addEventListener(customEvents.cexitapp.type, () => {
    if (document.body.id !== 'index')
        return;
    saveFile();
});
document.querySelector('#menu-exit').addEventListener('click', () => { ipcRenderer.send('closeApp'); });
