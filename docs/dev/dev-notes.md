# Updating code editor

Bono uses [Ace](https://ace.c9.io/) as the code editor, with a custom-defined Q# mode and highlight rules. The mode file is under the **/ace-qsp** folder. If you updated the mode files, follow these steps to rebuild:

1. If you haven't done so, clone [Ace source](https://github.com/ajaxorg/ace).
2. Go to Ace's root folder.
2. Copy **/ace-qsp/qsharp.js** and **/ace-qsp/qsharp_highlight_rules.js** to Ace's **/lib/ace/mode** folder.
```bash
cp ../bono/ace-qsp/qsharp_highlight_rules.js ./lib/ace/mode
cp ../bono/ace-qsp/qsharp.js ./lib/ace/mode
```
3. Rebuild Ace:
```bash
make build
```
>**NOTE**: You'll need to do ```npm install``` first from the root folder to resture required modules for the first run.
4. Once build finishes, copy **/build/src-min-noconflict/mode-qsharp.js** to Bono's **/html/scripts/ace** folder.
```bash
cp ./build/src-min-noconflict/mode-qsharp.js ../bono/html/scripts/ace/
```
>**NOTE**: Use [Ace's Model Creator](https://ace.c9.io/tool/mode_creator.html) to edit **qsharp_highlight_rules.js** file.