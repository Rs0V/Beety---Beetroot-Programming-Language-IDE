
class Shortcut {
    constructor(mod1, mod2, key, event) {
        this.mod1   = (mod1 === null) ? null : mod1[0].toUpperCase() + mod1.slice(1).toLowerCase();
        this.mod2   = (mod2 === null) ? null : mod2[0].toUpperCase() + mod2.slice(1).toLowerCase();
        this.key    = key.toLowerCase();
        this.event  = event;
    }
    GetShortCut() {
        let mod1 = (this.mod1 === 'Control') ? 'Ctrl' : this.mod1;
            mod1 = (this.mod1 === null) ? '' : this.mod1 + '+';
        let mod2 = (this.mod2 === 'Control') ? 'Ctrl' : this.mod2;
            mod2 = (this.mod2 === null) ? '' : this.mod2 + '+';

        return mod1 + mod2 + this.key.toUpperCase();
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
    },
    CompareKey: function(key, value) {
        let keyValue = null;
        if (key !== null) {
            switch (key) {
                case 'Control':
                case 'Ctrl':
                    keyValue = this.Ctrl;
                    break;
                case 'Shift':
                    keyValue = this.Shift;
                    break;
                case 'Alt':
                    keyValue = this.Alt;
                    break;
            }
        }
        if (keyValue === null || keyValue === value)
            return true;
        return false;
    },
    ResetKeys: function() {
        this.Ctrl  = false;
        this.Shift = false;
        this.Alt   = false;
    },
}
window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
        event.preventDefault();
        return false;
    }
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
let Files = null;
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
    fs.writeFileSync(Files[openFile].path, document.querySelector('#coding-space').value);
    Files[openFile].element.lastElementChild.style.display = 'none';
    Files[openFile].element.setAttribute('data-saved', 'true');
}
function saveAllFiles() {
    saveFile();
    Files.forEach((file, index) => {
        if (index !== openFile) {
            fs.writeFileSync(file.path, file.contents);
            file.element.lastElementChild.style.display = 'none';
            file.element.setAttribute('data-saved', 'true');
        }
    });
}
function createFileNameElement(_fileName) {
    const fileName = document.createElement('span');
    fileName.style.fontSize = '14px';
    fileName.style.fontWeight = '400';
    fileName.style.fontFamily = "'Source Code Pro', monospace";
    fileName.style.color = 'rgb(217, 100, 123)';
    fileName.style.flexShrink = '0';
    fileName.textContent = _fileName;

    return fileName;
}
function createFileElement(_fileImg, _fileName) {
    const fileIcon = document.createElement('img');
    switch (_fileImg) {
        case '.btrt':
            fileIcon.src = '../assets/Beety(icon)-fin.ico';
            break;
        case 'dir':
            fileIcon.src = '../assets/Plus-Sign-v1.png';
            break;
        default:
            fileIcon.src = '../assets/Files-Icon-v3.1.png';
            break;
    }
    fileIcon.style.height = '70%';
    fileIcon.style.flexShrink = '0';


    const fileName = createFileNameElement(_fileName)


    const fileStatusDot = document.createElement('img');
    fileStatusDot.src = '../assets/Dot-Icon-v1.png';
    fileStatusDot.style.height = '40%';
    fileStatusDot.style.flexShrink = '0';
    fileStatusDot.style.flexBasis = '10px';


    const fileElem = document.createElement('div');
    const fileElemContainer = document.createElement('div');

    fileElem.style.display = 'flex';
    fileElem.style.alignItems = 'center';
    fileElem.style.justifyContent = 'flex-start';
    fileElem.style.gap = '8px';

    fileElemContainer.style.width = '90%';
    fileElemContainer.style.height = '24px';

    fileElem.style.width = '100%';
    fileElem.style.height = '100%';

    fileElem.style.borderRadius = '4px';

    fileElem.style.boxSizing = 'border-box';
    fileElem.style.paddingLeft = '4px';
    fileElem.style.paddingRight = '4px';

    fileElem.style.cursor = 'pointer';

    fileElem.appendChild(fileIcon);
    fileElem.appendChild(fileName);
    fileStatusDot.style.display = 'none';
    fileElem.appendChild(fileStatusDot);

    fileElemContainer.appendChild(fileElem);

    fileElem.tabIndex = '0';
    fileElem.style.outline = 'none';

    fileElem.classList.add('file-elem');

    fileElem.setAttribute('data-saved', 'true');

    return fileElemContainer;
}
function createInputFileNameElement(oldNameElem) {
    const inputNameElem = document.createElement('input');
    inputNameElem.style.outline = 'none';
    inputNameElem.type = 'text';
    inputNameElem.spellcheck = false;

    inputNameElem.style.fontSize = '14px';
    inputNameElem.style.fontWeight = '400';
    inputNameElem.style.fontFamily = "'Source Code Pro', monospace";
    inputNameElem.style.color = 'rgb(217, 100, 123)';

    inputNameElem.style.height = '100%';
    inputNameElem.style.flexGrow = '1';
    inputNameElem.style.flexBasis = '0';

    inputNameElem.style.borderRadius = '4px'
    inputNameElem.style.border = '2px solid rgb(90, 8, 7)'
    inputNameElem.style.background = 'rgb(20, 2, 1)';

    inputNameElem.style.boxSizing = 'border-box';
    inputNameElem.style.padding = '4px';
    inputNameElem.style.paddingTop = '2px';
    inputNameElem.style.paddingBottom = '2px';

    inputNameElem.value = oldNameElem.textContent;

    inputNameElem.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    return inputNameElem;
}
function refreshFilesList(selected = null) {
    const codeSpace = document.querySelector('#coding-space');

    let mainFiles = null;
    try {
        mainFiles = fs.readdirSync(openFolder);
        // console.log(mainFiles);
    } catch (err) {
        console.log(`Unable to scan directory: ${err}`);
    }

    const cpBody = document.querySelector('#cp-body');
    while (cpBody.firstElementChild) {
        cpBody.removeChild(cpBody.lastElementChild);
    }

    Files = [];
    mainFiles.forEach((file) => {
        const stat = fs.statSync(path.join(openFolder, file));
        const isValid = stat.isDirectory() ||
            (stat.isFile() &&
            !['.cpp', '.exe'].includes(path.extname(file)));

        if (isValid) {
            const fileElemCont = createFileElement(stat.isFile() ? path.extname(file) : 'dir', file);
            const fileElem = fileElemCont.firstElementChild;

            if (stat.isFile()) {
                try {
                    Files.push({
                        name: file,
                        path: path.join(openFolder, file),
                        dirPath: openFolder,
                        contents: fs.readFileSync(path.join(openFolder, file), 'utf8'),
                        element: fileElem,
                    });
                } catch (err) {
                    console.log(`Couldn't read file: ${err}`);
                }

                const fileIndex = Files.length - 1;
                fileElem.addEventListener('click', (event) => {
                    fileElem.focus();
                    fileElem.classList.add('file-elem-selected');
                    if (openFile != null && !fileElem.isEqualNode(Files[openFile].element)) {
                        Files[openFile].contents = codeSpace.value;
                        Files[openFile].element.classList.remove('file-elem-selected');
                    }
                    openFile = fileIndex;
                    codeSpace.value = Files[openFile].contents;
                });
                fileElem.addEventListener('keydown', (event) => {
                    if (event.key === 'Tab') {
                        event.preventDefault();
                        return false;
                    }
                    if (event.repeat === false && event.key === 'F2') {
                        const fileNameElem = fileElem.children[1];
                        const inputNameElem = createInputFileNameElement(fileNameElem);

                        setTimeout(() => {
                            inputNameElem.focus();
                        }, 1);
                        
                        function blurFunc(event) {
                            const newFileName = createFileNameElement(Files[fileIndex].name);
                    
                            inputNameElem.removeEventListener('blur', blurFunc);
                            fileElem.replaceChild(newFileName, inputNameElem);
                            inputNameElem.remove();
                        }
                        inputNameElem.addEventListener('blur', blurFunc);

                        inputNameElem.addEventListener('keydown', (event) => {
                            event.stopPropagation();
                            if (event.repeat === false && event.key === 'Enter') {
                                event.preventDefault();
                    
                                const newFileName = createFileNameElement(inputNameElem.value);
                    
                                inputNameElem.removeEventListener('blur', blurFunc);
                                fileElem.replaceChild(newFileName, inputNameElem);
                                inputNameElem.remove();

                                const newFilePath = path.join(Files[fileIndex].dirPath, newFileName.textContent);
                                fs.renameSync(Files[fileIndex].path, newFilePath);

                                Files[fileIndex].name = newFileName.textContent;
                                Files[fileIndex].path = newFilePath;

                                refreshFilesList(Files[fileIndex].name);
                            }
                        });
                        fileElem.replaceChild(inputNameElem, fileNameElem);
                        fileNameElem.remove();
                    }
                });
            }
            cpBody.appendChild(fileElemCont);
        }
    });
    Files.forEach((file) => {
        if (file.name === selected)
            file.element.click();
    });
}

if (window.localStorage.getItem('openFolder')) {
    openFolder = window.localStorage.getItem('openFolder');
    refreshFilesList();
}



//--------------------
// SHORTCUTS CHECKS
//--------------------
const appShortCuts = {
    'open-folder': new Shortcut('Ctrl', 'Shift', 'O', () => {
        ipcRenderer.send('getOpenFolder');
        ipcRenderer.on('openFolder', (event, folderPath) => {
            openFolder = folderPath;
            window.localStorage.setItem('openFolder', openFolder);
            // console.log(openFolder);
            refreshFilesList();
        });
        modKeysCheck.ResetKeys();
    }),
    'new-file': new Shortcut('Ctrl', 'Shift', 'A', () => {
        if (openFolder) {
            fs.writeFileSync(path.join(openFolder, 'New File.txt'), '')
            refreshFilesList();
        }
    }),
    'save-file': new Shortcut('Ctrl', null, 'S', () => {
        if (document.body.id !== 'index')
            return;
        if (openFolder)
            saveFile();
    }),
    'save-all': new Shortcut('Ctrl', 'Shift', 'S', () => {
        if (document.body.id !== 'index')
            return;
        if (openFolder)
            saveAllFiles();
    }),
    'exit-app': new Shortcut('Ctrl', null, 'Q', () => {
        if (document.body.id !== 'index')
            return;
        ipcRenderer.send('closeApp');
    }),
    'terminal': new Shortcut('Ctrl', 'Shift', 'T', () => {
        if (document.body.id !== 'index')
            return;

        const terminal = document.querySelector('#terminal');
        const terminalMenuTick = document.querySelector('#menu-terminal > img');
        const app = document.querySelector('#app');

        if (terminal.getAttribute('data-visible')) {
            terminal.setAttribute('data-visible', terminal.getAttribute('data-visible') === 'true' ? 'false' : 'true');
            terminal.style.display = terminal.getAttribute('data-visible') === 'true' ? 'block' : '';
            terminalMenuTick.style.display = terminal.getAttribute('data-visible') === 'true' ? 'block' : '';

            let bottomLine = ['cs', 'cs'];
            if (terminal.getAttribute('data-visible') === 'true') {
                bottomLine[0] = 't';
                bottomLine[1] = 't';
            }
            if (app.getAttribute('data-cp-visible') === 'true')
                bottomLine[0] = 'cp';

            app.style.gridTemplateAreas = `
                "tb tb tb"
                "sp ${app.getAttribute('data-cp-visible') === 'true' ? 'cp' : 'cs'} cs"
                "sp ${bottomLine.join(' ')}"
            `;
        }
        else {
            terminal.setAttribute('data-visible', 'true');
            terminal.style.display = 'block';
            terminalMenuTick.style.display = 'block';

            app.style.gridTemplateAreas = `
                "tb tb tb"
                "sp ${app.getAttribute('data-cp-visible') === 'true' ? 'cp' : 'cs'} cs"
                "sp ${app.getAttribute('data-cp-visible') === 'true' ? 'cp' : 't'} t"
            `;
        }
    }),
};
window.addEventListener('keydown', (event) => {
    if (event.repeat === false) {
        // console.log(`Ctrl: ${modKeysCheck.Ctrl},   Shift: ${modKeysCheck.Shift},   Alt: ${modKeysCheck.Alt},   Key: ${event.key.toUpperCase()}`)
        for(let ascKey in appShortCuts) {
            const shortcut = appShortCuts[ascKey];

            const modKeys = ['Ctrl', 'Shift', 'Alt'];
            const mod12 = [shortcut.mod1 === 'Control' ? 'Ctrl' : shortcut.mod1,
                shortcut.mod2 === 'Control' ? 'Ctrl' : shortcut.mod2
            ];
            const nKeys = modKeys.filter((_key) => !mod12.includes(_key));
            if (nKeys.length === 1) nKeys.push(null);

            if (modKeysCheck.CompareKey(mod12[0], true) &&
                modKeysCheck.CompareKey(mod12[1], true) &&
                modKeysCheck.CompareKey(nKeys[0], false) &&
                modKeysCheck.CompareKey(nKeys[1], false) &&
                event.key.toLowerCase() === shortcut.key) {
                shortcut.event();
            }
        };
    }
});




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
        if (Files[openFile].element.getAttribute('data-saved') === 'true') {
            Files[openFile].element.setAttribute('data-saved', 'false');
            Files[openFile].element.lastElementChild.style.display = '';
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

            app.setAttribute('data-cp-visible', 'true');
            app.style.gridTemplateAreas = `
                "tb tb tb"
                "sp cp cs"
                "sp cp ${document.querySelector('#terminal').getAttribute('data-visible') === 'true' ? 't' : 'cs'}"
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

                app.setAttribute('data-cp-visible', 'false');
                app.style.gridTemplateAreas = `
                    "tb tb tb"
                    "sp cs cs"
                    "sp ${document.querySelector('#terminal').getAttribute('data-visible') === 'true' ? 't t' : 'cs cs'}"
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

    document.querySelector('#menu-open-folder').addEventListener('click', appShortCuts['open-folder'].event);
    document.querySelector('#menu-open-folder > span:last-child').innerText = appShortCuts['open-folder'].GetShortCut();

    document.querySelector('#create-file').addEventListener('click', appShortCuts['new-file'].event);

    document.querySelector('#menu-new-file').addEventListener('click', appShortCuts['new-file'].event);
    document.querySelector('#menu-new-file > span:last-child').innerText = appShortCuts['new-file'].GetShortCut();


    document.querySelector('#menu-save').addEventListener('click', appShortCuts['save-file'].event);
    document.querySelector('#menu-save > span:last-child').innerText = appShortCuts['save-file'].GetShortCut();

    document.querySelector('#menu-save-all').addEventListener('click', appShortCuts['save-all'].event);
    document.querySelector('#menu-save-all > span:last-child').innerText = appShortCuts['save-all'].GetShortCut();


    document.querySelector('#menu-exit').addEventListener('click', appShortCuts['exit-app'].event);
    document.querySelector('#menu-exit > span:last-child').innerText = appShortCuts['exit-app'].GetShortCut();


    document.querySelector('#menu-terminal').addEventListener('click', appShortCuts['terminal'].event);
    document.querySelector('#menu-terminal > span:last-child').innerText = appShortCuts['terminal'].GetShortCut();


    const searchBar = document.querySelector('#search-file-bar');
    searchBar.addEventListener('input', () => {
        Files.forEach((file) => {
            if (file.element.children[1].textContent.includes(searchBar.value))
                file.element.parentElement.style.display = '';
            else
                file.element.parentElement.style.display = 'none';
        });
    });
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

    btrtPath.addEventListener('input', () => {
        window.localStorage.setItem('btrtPath', btrtPath.value);
    });
    useBtrt.addEventListener('click', () => {
        window.localStorage.setItem('useBtrt', useBtrt.checked);
    });
    btrtPyPath.addEventListener('input', () => {
        window.localStorage.setItem('btrtPyPath', btrtPyPath.value);
    });
    prereqsPath.addEventListener('input', () => {
        window.localStorage.setItem('prereqsPath', prereqsPath.value);
    });
});
