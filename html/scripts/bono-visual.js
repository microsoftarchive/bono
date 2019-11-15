var bonov = {
    collectOutputs: function(circuit) {
        ret = [];
        for (var g = 0; g < circuit.stages.length; g++) {
            for (var q = 0; q < circuit.stages[g].gates.length; q++) {
                if (circuit.stages[g].gates[q]) {
                    if (circuit.stages[g].gates[q].type == "Out-Message" && circuit.stages[g].gates[q].parameters.length > 0) {
                        ret.push(circuit.stages[g].gates[q].parameters[0]);
                    }
                }
            }
        }
        return ret;
    },
    newViusalElement: function(draw, type) {
        return new bonov.MCircleElement(draw);
    }
}
bonov.svgNS = "http://www.w3.org/2000/svg";  
bonov.cellSize = 50;
bonov.cellPadding = 8;
bonov.columnSizes = [];
bonov.rowSizes = [];
bonov.dropTarget = null;
bonov.draw = null;
bonov.div = null;
bonov.stateDiv = null;
bonov.circuit = null;
bonov.stateCircuit = null;
bonov.debugBar = null;
bonov.registerColors = ['red','green','orange','blue','purple','gray']
bonov.stateBar = null;
bonov.CircuitElement = class CircuitElement {
    constructor(draw, div, idPrefix) {
        this.draw = draw;
        this.columnSizes = [130];
        this.rowSizes = [];
        this.columnOffsets = [0];
        this.rowOffsets = [];
        this.circuit = null;
        this.cellSize = bonov.cellSize;
        this.cellPadding = bonov.cellPadding;
        this.div = $("#" + div);
        this.div.on('mousemove', $.proxy(this.handleMouseMove, this));
        this.div.on('drop', $.proxy(this.dropGate, this));
        this.div.on('dragover', $.proxy(this.dragOver, this)); 
        this.div.on('dragleave', $.proxy(this.dragLeave, this)); 
        this.div.on('dragstart', $.proxy(this.dragStart, this));
        this.div.on('mouseout', $.proxy(this.handleMouseOut, this));
        this.div.on('click', $.proxy(this.handleClick, this));
        this.idPrefix = idPrefix;
        this.clickCallback = null;
        this.stateCol = -1;
        this.panel = $('<div draggable="false"><div /></div>');
        this.panel.addClass("panel");
        this.div.append(this.panel);
        $(this.panel).hide();
    }
    onclick(callback) {
        this.clickCallback = callback;
    }
    handleClick(event) {
        event.preventDefault();  
        var gateLocation = this.locateGate(event.pageX - this.div.offset().left, 10000);
         if (this.stateBar != null) {
            this.stateBar.move(gateLocation.nextLeft, 0);
        }
        //if (gateLocation.stage < 0) {
        //    return;
        //}
        
        this.stateCol = gateLocation.stage;
        if (this.clickCallback != null) {
            this.clickCallback(this.stateCol);
        } 
       
    }
    render() {
        this.draw.clear();
        var top = 0;
        this.columnSizes = [130];
        this.rowSizes = [];
        this.columnOffsets = [0];
        this.rowOffsets = [];
        for (var g = 0; g <= this.circuit.stages.length; g++){
            this.columnSizes.push(0);
            this.columnOffsets.push(0);
        }
        for (var q = 0; q <= this.circuit.qubits.length; q++) {
            this.rowSizes.push(0);
            this.rowOffsets.push(0);
        }
        var boxSize = this.cellSize - this.cellPadding * 2;
        for (var q = 0; q <= this.circuit.qubits.length; q++) {
            for (var g = 0; g <= this.circuit.stages.length; g++) {
                if (this.circuit.stages[g] && this.circuit.stages[g].gates[q] && this.circuit.stages[g].gates[q].result) {
                    switch (this.circuit.stages[g].gates[q].type) {
                        case "Circle":
                            var circleSpace = 5;
                            var boxSize = this.cellSize - this.cellPadding * 2;
                            var boxWidth = boxSize * this.circuit.stages[g].gates[q].result.coefficients.length + circleSpace * (this.circuit.stages[g].gates[q].result.coefficients.length-1) + this.circuit.stages[g].gates[q].result.coefficients.length/2;
                            this.updateGridSize([boxWidth + this.cellPadding, this.cellSize], g+1, q);
                            break;
                        case "SQubit":
                            var boxWidth = this.cellSize * 2.1  + 5;
                            this.updateGridSize([boxWidth * 2 + this.cellPadding, this.cellSize], g+1, q);
                            break;
                        case "Qubit":
                            var boxWidth = this.cellSize * 2.1  + Math.log2(this.circuit.stages[g].gates[q].result.coefficients.length) * 5;
                            this.updateGridSize([boxWidth * this.circuit.stages[g].gates[q].result.coefficients.length + this.cellPadding, this.cellSize], g+1, q);
                            break;
                        case "Probability":                            
                            this.updateGridSize([this.cellSize * 3, this.cellSize], g+1, q);
                            break;
                        case "Vector":
                            this.updateGridSize([this.cellSize * 3, this.cellSize * 2], g+1, q);
                            break;
                        default:
                            this.updateGridSize([this.cellSize, this.cellSize], g+1, q);        
                            break;
                    }
                } else {
                    this.updateGridSize([this.cellSize, this.cellSize], g+1, q);
                }
            }
        }
        for (var i = 1; i < this.columnOffsets.length; i++) {
            this.columnOffsets[i] = this.columnOffsets[i-1] + this.columnSizes[i-1];
        }
        for (var i = 1; i < this.rowOffsets.length; i++) {
            this.rowOffsets[i] = this.rowOffsets[i-1] + this.rowSizes[i-1];
        }
        for (var q = 0; q <= this.circuit.qubits.length; q++) {
            this.renderQubit(q, top);
            top += this.rowSizes[q];            
        }       

        for (var q = 0; q <= this.circuit.qubits.length; q++) {
            for (var g = 0; g <= this.circuit.stages.length; g++) {
                if (this.circuit.stages[g] && this.circuit.stages[g].gates[q]) {
                    if (this.circuit.stages[g].gates[q].controllerIndexes.length > 0) {
                        var arr = this.circuit.stages[g].gates[q].controllerIndexes;
                        for (var i = 0; i < arr.length; i++) {
                            this.draw.line(this.columnOffsets[g+1] + this.columnSizes[g+1]/2, 
                                  this.rowOffsets[arr[i]] + this.rowSizes[arr[i]]/2,
                                  this.columnOffsets[g+1] + this.columnSizes[g+1]/2, 
                                  this.rowOffsets[q] + this.rowSizes[q]/2).stroke({ width: 1 }).back();
                            if (this.circuit.stages[g].gates[q].controllerType == "Measure") {
                                this.draw.line(this.columnOffsets[g+1] + this.columnSizes[g+1]/2 + 3, 
                                    this.rowOffsets[arr[i]] + this.rowSizes[arr[i]]/2,
                                    this.columnOffsets[g+1] + this.columnSizes[g+1]/2 + 3, 
                                    this.rowOffsets[q] + this.rowSizes[q]/2).stroke({ width: 1 }).back();
                            }
                        }
                    }
                    if (this.circuit.stages[g].gates[q].type == "Measure") {
                         this.draw.line(this.columnOffsets[g+1] + this.columnSizes[g+1]/2, 
                                  this.rowOffsets[q] + this.rowSizes[q]/2 - 3,
                                  this.columnOffsets[this.columnOffsets.length-1] + this.columnSizes[this.columnOffsets.length-1], 
                                  this.rowOffsets[q] + this.rowSizes[q]/2 - 3).stroke({ width: 1 }).back();
                    }
                }
            }
        }

        //if (this.stateCol < 0) {
            this.updateStateBar()
        //}
    }
    updateStateBar() {
        if (this.stateBar != null ) {            
            this.stateBar.hide();
            this.stateBar= null;
        } 
        if (this.stateCol < 0) {
            this.stateCol = this.circuit.stages.length-1;
        }
        this.stateBar = this.draw.rect(3, this.rowOffsets[this.rowOffsets.length-1]+this.rowSizes[this.rowSizes.length-1]).fill('orange').hide();

        var offset = 0;
        for (var i = 0; i <= this.stateCol+1; i++) {
            offset += this.columnSizes[i];
        }
        this.stateBar.move(offset, 0);
    }
    renderQubit(q, top) {        
        var offset = 0;
        this.renderQubitHeader(q, top);    
        offset = this.columnSizes[0];    
        for (var g = 0; g <= this.circuit.stages.length; g++) {
                this.renderGate(q, g, top, offset);
                offset += this.columnSizes[g+1];
        }        
        if (!this.circuit.qubits[q] || !this.circuit.qubits[q].isClassic) {
            this.draw.line(this.columnSizes[0], top + this.cellSize /2, this.columnOffsets[this.columnOffsets.length-1] + this.columnSizes[this.columnOffsets.length-1], top + this.cellSize /2).stroke({ width: 1 }).back();
            //} else {
            //    this.draw.line(0, top + this.cellSize /2, offset, top + this.cellSize /2).stroke({ width: 1 }).back();
            //}
        }     
    }
    renderQubitHeader(q, top) {
        if (!this.circuit.qubits[q] || !this.circuit.qubits[q].isClassic) {
            var group = this.draw.group();
            var label = "qubit" + (q+1);
            if (this.circuit.qubits[q] && this.circuit.qubits[q].name != "") {
                label = this.circuit.qubits[q].name;
            }
            var name = this.draw.text(label).attr({x: bonov.cellSize/2, y: bonov.cellSize/2 })
                .font({size: 20, family: 'Helvetica'})
                .move(this.cellPadding,this.cellPadding-2);
            group.add(name);
            var line = this.draw.line(100,this.cellPadding,100, this.cellPadding + 20).stroke({ width: 1 });
            var text = this.draw.text("0").attr({x:bonov.cellSize/2, y:bonov.cellSize/2 })
                .font({size: 20, family: 'Helvetica'})
                .move(105,this.cellPadding-2);
            var line1 = this.draw.line(120,this.cellPadding,125, this.cellPadding + 10).stroke({ width: 1 });
            var line2 = this.draw.line(125,this.cellPadding+10,120, this.cellPadding + 20).stroke({ width: 1 });
            group.add(line);
            group.add(text);
            group.add(line1);
            group.add(line2);

            if (this.circuit.qubits[q]) {
                var register = this.draw.rect(5, this.cellSize).fill(bonov.registerColors[this.circuit.qubits[q].register % bonov.registerColors.length]);
                register.move(0,-15);
                group.add(register);
            }
            group.move(0, top+7);
        }
    }
    renderGate(q, g, top, offset) {
        if (!this.circuit.stages[g] || ! this.circuit.stages[g].gates[q]) {
            return [this.cellSize,this.cellSize];
        }
        var vElm = null;
        switch (this.circuit.stages[g].gates[q].type){
            case "Empty":
                return [this.cellSize,this.cellSize];
            case "Sample":
                vElm = new bonov.SampleElement(this.draw, this);
                break;
            case "Measure":
                vElm = new bonov.MeasureElement(this.draw, this);
                break;
            case "Root":
                vElm = new bonov.RootElement(this.draw, this);
                break;
            case "Qubit":
                vElm = new bonov.QubitElement(this.draw, this);
                break;
            case "SQubit":
                vElm = new bonov.SingleQubitElement(this.draw, this);
                break;
            case "Probability":
                vElm = new bonov.ProbabilityElement(this.draw, this);
                break;
            case "Circle":
                vElm = new bonov.CircleElement(this.draw, this);
                break;
            case "MCircle":
                vElm = new bonov.MCircleElement(this.draw, this);
                break;
            case "C":
                vElm  = new bonov.ControlElement(this.draw, this);
                break;
            case "N":
                vElm = new bonov.NotElement(this.draw, this);
                break;
            case "Out-Message":
                vElm = new bonov.MessageElement(this.draw, this);
                break;
            case "Bloch":
                vElm = new bonov.BlochElement(this.draw, this);
                break;
            case "BarChart":
                vElm = new bonov.BarChartElement(this.draw, this);
                break;
            case "Vector":
                vElm = new bonov.VectorElement(this.draw, this);
                break;
            default:
                vElm = new bonov.GateElement(this.draw, this);
                break;
        }
        var i = Math.floor(Math.min(this.circuit.stages[g].outputs.length-1, q));
        vElm.render(this.circuit.stages[g], g, q, this.circuit.stages[g].outputs[i].smallEndian(), offset, top, this.circuit.qubits.length);
    }

    updateGridSize(size, g, q) {
        if (this.columnSizes[g] < size[0]) {
            this.columnSizes[g] = size[0];
        }
        if (this.rowSizes[q] < size[1]) {
            this.rowSizes[q] = size[1];
        }        
    }
    makeGateId (g, q) {
        return this.idPrefix + "-gate-" + g + "-" + q;
   }
    
    update() {
        
        for (var q = 0; q < this.circuit.qubits.length; q++) {
            for (var g = 0; g < this.circuit.stages.length; g++) {
                if (this.circuit.stages[g].gates[q]) {
                    var vElm = null;
                    switch (this.circuit.stages[g].gates[q].type) {
                        case "Sample":
                            vElm = new bonov.SampleElement(this.draw, this);
                            break;
                    }
                    if (vElm) {
                        var i = Math.floor(Math.min(this.circuit.stages[g].outputs.length-1, q));
                        vElm.update(g, q, this.circuit.stages[g].outputs[i]);
                    }
                }
            }
        }
    }

    handleMouseMove(event) {        
        if (this.stateBar != null){
            this.stateBar.show();
        }
        //event.preventDefault();        
        var gateLocation = this.locateGate(event.pageX - this.div.offset().left, 10000);
        //if (gateLocation.stage < 0) {
        //    return;
        //}
        if (this.debugBar == null ) {            
            this.debugBar = this.draw.rect(5, gateLocation.top).fill({color: 'skyblue', opacity: 0.5});
            this.debugBar.move(gateLocation.nextLeft-1, 0);
        } else {
            if (gateLocation.left>0) {
                this.debugBar.move(gateLocation.nextLeft-1, 0);
            }
        }        
    }
    locateGate (x,y) {
        var left = 0;
        var top  = 0;
        var g = 0;
        var q = 0;        
        for (var i = 0; i < this.columnSizes.length; i++) {
            if (x >= left && x <= left+this.columnSizes[i]+5) {
                g = i;
                break;
            }
            left += this.columnSizes[i];
        }
        for (var i = 0; i < this.rowSizes.length; i++) {
            if (y >= top && y <= top+this.rowSizes[i]) {
                q = i;
                break;
            }
            top += this.rowSizes[i];
        }        
        //left += this.columnSizes[g];
        return {
            stage: g-1,
            qubit: q,
            left: left,
            top: top,
            nextLeft: left + this.columnSizes[g]
        };
    }
    handleMouseOut(event) {
        if (this.debugBar != null) {
            this.debugBar.hide();
            this.debugBar = null;
        }
        if (this.stateBar != null){
            this.stateBar.hide();
        }
    }
    dropGate(event) {
        event.preventDefault();
        var data = event.originalEvent.dataTransfer.getData("gate");               
        var gateLocation = this.locateGate(event.pageX - this.div.offset().left, event.pageY - this.div.offset().top);
        if (this.dropTarget != null) {
            this.dropTarget.hide();          
            this.dropTarget = null;  
        }
        if (this.debugBar != null) {
            this.debugBar.hide();
            this.debugBar = null;
        }
        if (gateLocation.stage < 0) {
            return;
        }          

        //fill in empty columns as necessary
        if (this.circuit.stages.length <= gateLocation.stage) {                
            var cLength = this.circuit.stages.length;
            for (var i = 0; i <= gateLocation.stage - cLength + 1; i++) {
                this.circuit.stages.push(new bono.Stage([]));
            }
        }
     
        //fill in empty rows as necessary
        if (this.circuit.stages[gateLocation.stage].gates.length <= gateLocation.qubit) {
            var rLength = this.circuit.stages[gateLocation.stage].gates.length;
            for (var i = 0; i < gateLocation.qubit - rLength + 1; i++) {
                this.circuit.stages[gateLocation.stage].addGate(new bono.Gate("Empty"));
            }
        }

        var classicRow = true;
        var emptyRow = true;
        for (var i = 0; i < this.circuit.stages.length; i++) {
            if (this.circuit.stages[i].gates[gateLocation.qubit] != null 
                && this.circuit.stages[i].gates[gateLocation.qubit].type != "Empty")
            {
                emptyRow = false;
                if (this.circuit.stages[i].gates[gateLocation.qubit].isClassic == false) {
                    classicRow = false;
                    break;
                }
            }
        }

        var newGate = bono.newGate(data);
        
        if (!emptyRow && (!classicRow && newGate.isClassic || classicRow && !newGate.isClassic)) {
            for (var i = 0; i < this.circuit.stages.length; i++) {
                this.circuit.stages[i].insertGate(gateLocation.qubit,locator.circuit.newGate("Empty"));
            }
            this.circuit.qubits.splice(gateLocation.qubit, 0, locator.circuit.newQubit());   
        }
     
        if (this.circuit.stages[gateLocation.stage].gates[gateLocation.qubit] == null ||
            this.circuit.stages[gateLocation.stage].gates[gateLocation.qubit].type == "Empty") {
            //current cell is empty, create the new gate
            this.circuit.stages[gateLocation.stage].updateGate(gateLocation.qubit, newGate);
        } else {
            //The cell is occupied, insert a new column
            this.circuit.stages.splice(gateLocation.stage, 0, new bono.Stage([]));
            for (var i = 0; i < gateLocation.qubit; i++) {
                this.circuit.stages[gateLocation.stage].addGate(new bono.Gate("Empty"));
            }
            //then create the gate
            this.circuit.stages[gateLocation.satge] = new bono.Stage([]);
            this.circuit.stages[gateLocation.stage].addGate(newGate);
        }
        
        //fill in qubits as necessary
        if (this.circuit.qubits.length <= gateLocation.qubit) {
            for (var i = this.circuit.qubits.length; i <= gateLocation.qubit; i++) {
                this.circuit.qubits.push(bono.newQubit());
            }
        }

        //this is the last column, append a new column for future drops
        if (this.circuit.stages.length == gateLocation.stage + 1) {
            this.circuit.stages.push(new bono.Stage([]));
        }    

        //compact the ciruit to remove empty rows/columns
        this.circuit.compact();
    }
    dragOver(event){
        event.preventDefault();        
        var dotSize = 10;
        var gateLocation = this.locateGate(event.pageX - this.div.offset().left, event.pageY - this.div.offset().top);
        if (gateLocation.stage < 0) {
            return;
        }
        if (this.dropTarget == null ) {            
            this.dropTarget = this.draw.circle(dotSize).fill('red'); //.move(gateLocation[2]  + this.cellSize/2 , gateLocation[3] +  this.cellSize/2);   
            this.dropTarget.addClass('nodrop');
            this.dropTarget.move(gateLocation.left  + this.cellSize/2 - dotSize/2 , gateLocation.top +  this.cellSize/2 - dotSize/2);          
        } else {
            this.dropTarget.move(gateLocation.left  + this.cellSize/2 - dotSize/2 , gateLocation.top +  this.cellSize/2 - dotSize/2);               
        }        
    }
    dragLeave(event) {
        event.preventDefault();   
        if (this.dropTarget != null) {
            this.dropTarget.hide();          
            this.dropTarget = null;  
        }
        this.circuit.compact();
    }
    dragStart(ev) {
        if (!$(this.panel).is(':hidden')) {
            ev.stopPropagation();
            return false;
        }
        var img = document.createElement("img");        
        ev.originalEvent.dataTransfer.setDragImage(img, 0, 0 );
        var gateLocation = this.locateGate(ev.originalEvent.pageX - this.div.offset().left, ev.originalEvent.pageY - this.div.offset().top);
        ev.originalEvent.dataTransfer.setData("gate", this.circuit.stages[gateLocation.stage].gates[gateLocation.qubit].desc);
        this.circuit.stages[gateLocation.stage].gates[gateLocation.qubit] = null;
    }
    updatePanelContent(stage, gateIndex) {
        var panel = $('<div draggable="false" />');
        panel.addClass("inner-panel");
        var button = $('<button type="button" class="btn btn-secondary panel-button"></button>');
        button.on('click', $.proxy(this.handlePanelButtonClick, this));
        panel.append(button);
        var body = $('<div draggable="false"/>');
        switch (stage.gates[gateIndex].type) {
            case 'Ry':
                var slider = $("<input type='range' min='0' max='100' value='50'>");
                slider.on('input', $.proxy(this.panelSliderChange, this, stage, gateIndex));
                body.append(slider);
                break;
            case 'Rt':
                this.setGatePanel(body, {
                    title: 'R&phi;',
                    overview: 'Rotation.',
                    matrix: stage.gates[gateIndex].matrix,
                });
                body.append("<h5>Parameters</h5");
                var slider = $('<input type="range" min="0" max="360" value="' + parseInt(stage.gates[gateIndex].parameters[0]) + '">');
                slider.on('input', $.proxy(this.panelSliderChange, this, stage, gateIndex));
                body.append('<span class="param-name">Theta</span>');
                body.append(slider);
                body.append(stage.gates[gateIndex].parameters[0]);
                break;
            case 'H':
                this.setGatePanel(body, {
                    title: 'Hadamard Gate',
                    overview: 'Creates superposition.',
                    matrix: stage.gates[gateIndex].matrix,
                });
                break;
            default:
                this.setGatePanel(body, {
                    title: stage.gates[gateIndex].type,
                    matrix: stage.gates[gateIndex].matrix,
                });
                break;
        }
        panel.append(body);
        $(this.panel).children(":first").replaceWith(panel);
    }
    updatePanel(stage, gateIndex, x, y) {
        this.updatePanelContent(stage, gateIndex);
        $(this.panel).show();
        $(this.panel).offset({left:x + this.div.offset().left + this.cellSize/2, top: y + this.div.offset().top + this.cellSize/2});
    }
    setGatePanel(body, desc) {
        body.append("<h4>" + desc.title + "</h4>");
        body.append(desc.overview);
        body.append("<h5>Matrix</h5");
        body.append(desc.matrix.toHTMLTable());
    }
    panelSliderChange(stage, gateIndex, e) {
        e.originalEvent.stopPropagation();
        stage.updateGateParameter(gateIndex, 0, $(e.target).val()); 
    }
    handlePanelButtonClick(event) {
        event.preventDefault();  
        $(this.panel).hide();
    }
}
bonov.StateElement = class StateElement {
    constructor(draw, div, idPrefix, gateType) {
        this.draw = draw;
        this.div = $("#" + div);
        this.idPrefix = idPrefix;
        this.gateType = gateType;
        this.visualElement = null;
    }
    render(circuit, col) {
        this.draw.clear();
        if (this.visualElement == null || this.visualElement.type != this.gateType) {
            this.visualElement = bonov.newViusalElement(this.draw, this.gateType, this);
        }

        if (col < 0) {
            this.visualElement.render(null, -1, -1, bono.makeQubitRegister(circuit.qubits.length), bono.cellPadding, top, circuit.qubits.length);
        } else if (circuit.stages[col] && circuit.stages[col].combinedOutputs) {
            this.visualElement.render(circuit.stages[col], col, -1, circuit.stages[col].combinedOutputs.smallEndian(), bonov.cellPadding, top, circuit.qubits.length);
        }
    }
    update(circuit, col) {
        this.render(circuit, col);
    }
}
bonov.VisualElement = class VisualElement {
    constructor(draw, type,parent) {
        this.draw = draw;
        this.type = type;
        this.parent = parent;
    }
    render(stage, s, q, qubit, left, top, registerSize) {

    }
    update(s, q, qubit) {

    }
    estimateSize() {
        return [bonov.cellSize, bonov.cellSize];
    }
}
bonov.MCircleElement = class MCircleElement extends bonov.VisualElement {
    constructor(draw,parent) {
        super(draw, "MCircle",parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var circleSpace = 5;
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var p = Math.floor(Math.log2(qubit.coefficients.length));
        var p1 = Math.max(Math.floor(p / 2), 1);
        var width = Math.floor(Math.pow(2, p1));
        var height =  Math.floor(Math.pow(2, p - p1));
        var boxWidth = boxSize * width + circleSpace * (width-1) + width/2;
        var boxHeight = bonov.cellSize * registerSize;
        boxWidth = width * boxHeight / height;

        boxSize = (boxHeight - circleSpace * height) / height;
        var circleSize = boxSize * 0.8;

        var rect = this.draw.rect(boxWidth, boxHeight).fill('#323232').radius(boxSize/2);
        group.add(rect);

        var inOffset = circleSpace+2;
        var tOffset = 2;
        for (var i = 0; i < qubit.coefficients.length; i++) {
            var circle = this.draw.circle(circleSize+1).fill('transparent').stroke({ width: 2, color: 'white' });
            circle.move(inOffset,(boxSize-circleSize)/2+tOffset);
            group.add(circle);

            var size = Math.abs(qubit.coefficients[i].magnitude() * circleSize).toFixed(0);
            var cOffset = (circleSize - size) /2;
            var cx = inOffset + circleSize/2;
            var cy = boxSize/2;
            var ex = cx - (size/2) * Math.sin(qubit.coefficients[i].phase());
            var ey = cy - (size/2) * Math.cos(qubit.coefficients[i].phase());
            if (size > 0) {
                var backLine = this.draw.line(cx, cy+tOffset, cx, cy-circleSize/2+tOffset).stroke({ width:1, color: 'lightgray' });
                group.add(backLine);
            }
            var inCircle = this.draw.circle(size).fill('skyblue');
            inCircle.move(inOffset+cOffset,(boxSize-size)/2+tOffset);
            group.add(inCircle);

            var line = this.draw.line(cx, cy+tOffset, ex, ey+tOffset).stroke({ width: 3, color: 'darkblue' });
            group.add(line);
            inOffset += boxSize + circleSpace;
            if ((i+1) % width == 0) {
                tOffset += boxSize + circleSpace;
                inOffset = circleSpace;
            }
        }
        group.move(left+bonov.cellPadding,top);
    }
}
bonov.SingleQubitElement = class SingleQubitElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "SQubit", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var boxWidth = bonov.cellSize * 2.1  +  5;
        var rect = this.draw.rect(boxWidth * 2, boxSize).fill('#323232').radius(boxSize/2);
        var zero = new bono.Complex(0,0);
        var one = new bono.Complex(0,0);
        //var inQubit = qubit.smallEndian();
        var mask = 1;
        if (q > 0) {
            mask = 1 << q;
        }
         for (var i = 0; i < qubit.coefficients.length; i++) {
            if (((qubit.coefficients.length-1-i) & mask) > 0) {
                zero = zero.add(qubit.coefficients[i]);
            } else if ((i & mask) > 0) {
                one = one.add(qubit.coefficients[i]);
            }
        }
        var newQubit = new bono.Qubit([zero, one]);
        var text = this.makeText(newQubit);
        text.node.id = this.parent.makeGateId(s,q) + "-t";
        text.center(boxWidth , boxSize/2);
        group.add(rect);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);      
    }
    makeText(qubit) {
        var notations = [];
        for (var i = 0; i < qubit.coefficients.length; i++) {
            var str = i.toString(2);
            var bits = Math.round(Math.log2(qubit.coefficients.length));
            if (str.length < bits) {
                str = "0".repeat(bits - str.length) + str;
            }
            notations.push("|" + str + ">");
        }
        var text = this.draw.text('').fill('white').font({size: 18, family: 'Helvetica'});
        text.build(true);
        if (qubit.coefficients[0].a >= 0) { //TBD: This is incorrrect
            text.tspan(this.formatNumber(qubit.coefficients[0].magnitude().toFixed(2), 4)).fill('lawngreen');
        } else {
            text.tspan(this.formatNumber(qubit.coefficients[0].magnitude().toFixed(2), 4)).fill('red');
        }
        text.plain(notations[0]);
        for (var i = 1; i < qubit.coefficients.length; i++) {
            if (qubit.coefficients[i].a >= 0) { //TBD: This is incorrect
                text.plain(' + ');
            } else {
                text.plain(' - ');
            }
            if (qubit.coefficients[i].a >= 0) { //TBD: This is incorrect
                text.tspan(this.formatNumber(qubit.coefficients[i].magnitude().toFixed(2), 4)).fill('lawngreen');
            } else {
                text.tspan(this.formatNumber(qubit.coefficients[i].magnitude().toFixed(2), 4)).fill('red');
            }
            text.plain(notations[i]);
        }
        text.build(false);
        return text;
    }
    formatNumber(number,digits) {
        var k = Math.abs(number);
        var s = k.toString().padEnd(4, "0");
        if (k == 1) {
            s = "1.00";
        } else if ( k == 0) {
            s = "0.00";
        }
        return s;
    }
    update(s, q, qubit) {
        var text = this.makeText(qubit);
        text.node.id = this.parent.makeGateId(s,q) + "-t";
        SVG.get(this.parent.makeGateId(s,q)+"-t").replace(text);        
    }
}
bonov.QubitElement = class QubitElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Qubit", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var boxWidth = bonov.cellSize * 2.1  + Math.log2(qubit.coefficients.length) * 5;
        var rect = this.draw.rect(boxWidth * qubit.coefficients.length, boxSize).fill('#323232').radius(boxSize/2);

        var notations = [];
        for (var i = 0; i < qubit.coefficients.length; i++) {
            var str = i.toString(2);
            var bits = Math.round(Math.log2(qubit.coefficients.length));
            if (str.length < bits) {
                str = "0".repeat(bits - str.length) + str;
            }
            notations.push("|" + str + ">");
        }
       
        var text = this.draw.text('').fill('white').font({size: 18, family: 'Helvetica'});
        text.build(true);
        if (qubit.coefficients[0].a >= 0) { //TBD: This is incorrrect
            text.tspan(this.formatNumber(qubit.coefficients[0].magnitude().toFixed(2), 4)).fill('lawngreen');
        } else {
            text.tspan(this.formatNumber(qubit.coefficients[0].magnitude().toFixed(2), 4)).fill('red');
        }
        text.plain(notations[0]);
        for (var i = 1; i < qubit.coefficients.length; i++) {
            if (qubit.coefficients[i].a >= 0) { //TBD: This is incorrect
                text.plain(' + ');
            } else {
                text.plain(' - ');
            }
            if (qubit.coefficients[i].a >= 0) { //TBD: This is incorrect
                text.tspan(this.formatNumber(qubit.coefficients[i].magnitude().toFixed(2), 4)).fill('lawngreen');
            } else {
                text.tspan(this.formatNumber(qubit.coefficients[i].magnitude().toFixed(2), 4)).fill('red');
            }
            text.plain(notations[i]);
        }
        text.build(false);
        text.center(boxWidth * qubit.coefficients.length / 2, boxSize/2);
        group.add(rect);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);      
    }
    formatNumber(number,digits) {
        var k = Math.abs(number);
        var s = k.toString().padEnd(4, "0");
        if (k == 1) {
            s = "1.00";
        } else if ( k == 0) {
            s = "0.00";
        }
        return s;
    }
}

bonov.GateElement = class GateElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Gate", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var gate = stage.gates[q];
        var group = this.draw.group();
        //group.node.id = this.makeGateId(q,g);
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var color = 'white';
        switch (gate.desc){
            case "I":
                color = '#924BFD';
                break;
            case "H":
                color = '#0079CC';
                break;
            case "X":
            case "Y":
            case "Z":
                color = '#0F7D78';
                break;
            default:
                color = '#FE7704';
                break;
        }
        var rect = this.draw.rect(boxSize,boxSize).fill(color); //.stroke({ width: 1 });
        rect.move(bonov.cellPadding, bonov.cellPadding);
        group.add(rect);
        var label = '';
        if (gate) {
            if (gate.isClassic) {
                label = gate.result[0].toString();
            } else {
                switch (gate.desc) {
                    case "Rt,45":
                        label = "T";
                        break;
                    case "Rt,90":
                        label = "S";
                        break;
                    default:
                        label = gate.type;
                        break;
                }
                
            }
        }
        var text = this.draw.text(label).attr({x:35, y:35, fill: 'white' })
            .font({size: 20, family: 'Helvetica'})
            .center(bonov.cellSize/2, bonov.cellSize/2);
        group.add(text);    
        group.move(left,top);        
        group.on('click', $.proxy(this.parent.updatePanel, this.parent, stage, q, left, top));
    }
}

bonov.MessageElement = class MessageElement extends bonov.VisualElement{
    constructor(draw, parent) {
        super(draw, "Out-Message", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var gate = stage.gates[q];
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var boxWidth = bonov.boxSize;
        var label = '';
        if (gate.parameters.length > 0) {
            label = gate.parameters[0];
        }
        boxWidth = Math.max(10 * label.length, bonov.cellSize);
        var rect = this.draw.rect(boxWidth, boxSize).fill('#00FF00').radius(boxSize/2);       
        var text = this.draw.text(label).fill('white').font({size: 18, family: 'Helvetica'});
        text.center(boxWidth / 2, boxSize/2);
        group.add(rect);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);        
    }
}

bonov.NotElement = class NotElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "N", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var cSize = 30;
        this.draw.circle(cSize).fill('transparent').stroke({ width: 1 }).move(left + bonov.cellSize/2 - cSize/2, top + bonov.cellSize/2 - cSize/2);
        this.draw.line(left + bonov.cellSize/2, top + bonov.cellSize/2-cSize/2, left + bonov.cellSize/2, top + bonov.cellSize/2 + cSize/2).stroke({ width: 1 });        
    }   
}

bonov.ControlElement = class ControlElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "N", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var cSize = 10;
        this.draw.circle(cSize).fill('black').move(left + bonov.cellSize/2 - cSize/2, top +  bonov.cellSize/2 - cSize/2);        
    }
}

bonov.CircleElement = class CircleElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Circle", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var gate = stage.gates[q];
        var group = this.draw.group();
        var circleSpace = 5;
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var boxWidth = boxSize * gate.result.coefficients.length + circleSpace * (gate.result.coefficients.length-1) + gate.result.coefficients.length/2;
        var circleSize = boxSize * 0.8;

        var rect = this.draw.rect(boxWidth, boxSize).fill('#323232').radius(boxSize/2);
        group.add(rect);

        var inOffset = circleSpace-1;
        for (var i = 0; i < gate.result.coefficients.length; i++) {
            var circle = this.draw.circle(circleSize+1).fill('transparent').stroke({ width: 2, color: 'white' });
            circle.move(inOffset,(boxSize-circleSize)/2);
            group.add(circle);

            var size = Math.abs(gate.result.coefficients[i].magnitude() * circleSize).toFixed(0);
            var cOffset = (circleSize - size) /2;
            var cx = inOffset + circleSize/2;
            var cy = boxSize/2;
            var ex = cx - (size/2) * Math.sin(gate.result.coefficients[i].phase());
            var ey = cy - (size/2) * Math.cos(gate.result.coefficients[i].phase());
            if (size > 0) {
                var backLine = this.draw.line(cx, cy, cx, cy-circleSize/2).stroke({ width:1, color: 'lightgray' });
                group.add(backLine);
            }
            var inCircle = this.draw.circle(size).fill('skyblue');
            inCircle.move(inOffset+cOffset,(boxSize-size)/2);
            group.add(inCircle);

            var line = this.draw.line(cx, cy, ex, ey).stroke({ width: 3, color: 'darkblue' });
            group.add(line);
            inOffset += boxSize + circleSpace;
        }
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);
    }
}

bonov.ProbabilityElement = class ProbabilityElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Probability", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var gate = stage.gates[q];
        var probability = gate.result.coefficients[0].magnitude() * gate.result.coefficients[0].magnitude();
        var gradient = this.draw.gradient('linear', function(stop) {
            stop.at(0, '#3F3F3F'),
            stop.at(probability, '#3F3F3F'),
            stop.at(probability, '#008F00'),
            stop.at(1, '#008F00')
        });
        gradient.from(0, 0).to(0, 1);

        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var rect = this.draw.rect(boxSize*3, boxSize).fill(gradient).radius(boxSize/2);
        var text = this.draw.text(((1-probability) * 100).toFixed(2) + "%").attr({x:35, y:35 })
            .font({size: 20, fill: 'white', family: 'Helvetica'})
            .center(boxSize * 1.5, boxSize/2);
        group.add(rect);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);        
    }
}

bonov.RootElement = class RootElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Root", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var rect = this.draw.rect(boxSize,boxSize).fill('#DC1C2B'); 
        var p = this.draw.path('m 25 10 h -12 l -2 15 l -4 -5').fill('none').stroke({ color: 'white', width: 2 });
        group.add(rect);
        group.add(p);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);      
    }
}

bonov.MeasureElement = class MeasureElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Measure", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var rect = this.draw.rect(boxSize,boxSize).fill('#32AAF8');
        var arc = this.draw.path(this.describeArc(boxSize/2, boxSize/2 + 10, boxSize/3, -70, -290)).fill('transparent').stroke({ color:'white', width: 1 });
        var line = this.draw.line(boxSize/2, boxSize/2 + 10, boxSize/2 + 15, boxSize/2-5).stroke({color: 'white', width: 1});
        group.add(rect);
        group.add(arc);
        group.add(line);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);      
    }
    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }
    describeArc (x, y, radius, startAngle, endAngle){
        var start = this.polarToCartesian(x, y, radius, endAngle);
        var end = this.polarToCartesian(x, y, radius, startAngle);

        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        var d = [
            "M", start.x, start.y, 
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        return d;       
    }
}

bonov.BlochElement = class BlochElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Bloch", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        group.node.id = this.parent.makeGateId(s, q);
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var circle = this.draw.circle(boxSize).fill({color: '#00ACFF', opacity: 0.5}).stroke({width: 1});
        circle.node.id = this.parent.makeGateId(s, q) + "-c";
        group.add(circle);
        var hellipse = this.draw.ellipse(boxSize, boxSize/2).fill({opacity: 0}).stroke({width: 1});
        group.add(hellipse);
        hellipse.move(0, boxSize/4);
        var vellipse = this.draw.ellipse(boxSize/2, boxSize).fill({opacity: 0}).stroke({width: 1});
        group.add(vellipse);
        vellipse.move(boxSize/4, 0);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);    
    }
}

bonov.BarChartElement = class BarChartElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "BarChart", parent);
    }
}

bonov.VectorElement = class VectorElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Vector", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
         var group = this.draw.group();
         group.node.id = this.parent.makeGateId(s, q);
         var boxSize = bonov.cellSize*3 - bonov.cellPadding * 2;
         var rect = this.draw.rect(boxSize, boxSize * 2 / 3).fill('#323232'); //.radius(boxSize/2);
         group.add(rect);
         
         var label = "";
         for (var i = 0; i < qubit.coefficients.length; i++) {
             label += qubit.coefficients[i].toString(3);
             if (i < qubit.coefficients.length-1) {
                 label += "\n";
             }
         }
         var text = this.draw.text(label).attr({x:35, y:35 })
            .font({size: 20, fill: 'white', family: 'Helvetica'})
            .center(boxSize/2, boxSize/3);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);       
    }
}

bonov.SampleElement = class SampleElement extends bonov.VisualElement {
    constructor(draw, parent) {
        super(draw, "Sample", parent);
    }
    render(stage, s, q, qubit, left, top, registerSize) {
        var group = this.draw.group();
        group.node.id = this.parent.makeGateId(s, q);
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;

        var result = 1;
        var mag = stage.gates[q].result.coefficients[0].magnitude();
        var rand = Math.random();
        if (rand <= mag * mag) {
            result = 0;
        } 

        if (result == 1) {
            var circle = this.draw.circle(boxSize).fill('#008F00');
        } else {
            var circle = this.draw.circle(boxSize).fill('#3F3F3F'); 
        }
        circle.node.id = this.parent.makeGateId(s, q) + "-c";
        var text = this.draw.text(result.toString()).attr({x:35, y:35 })
            .font({size: 20, fill: 'white', family: 'Helvetica'})
            .center(boxSize/2, boxSize/2);
        text.node.id = this.parent.makeGateId(s, q) + "-t";
        group.add(circle);
        group.add(text);
        group.move(left+bonov.cellPadding,top+bonov.cellPadding);        
    }
    update(s, q, qubit) {
        var boxSize = bonov.cellSize - bonov.cellPadding * 2;
        var result = 1;
        var mag = qubit.coefficients[0].magnitude();
        var rand = Math.random();
        if (rand <= mag * mag) {
            result = 0;
        } 

        if (result == 1) {
            var circle = this.draw.circle(boxSize).fill('#008F00');
        } else {
            var circle = this.draw.circle(boxSize).fill('#3F3F3F'); 
        }
        circle.node.id = this.parent.makeGateId(s,q) + "-c";
        var text = this.draw.text(result.toString()).attr({x:35, y:35 })
            .font({size: 20, fill: 'white', family: 'Helvetica'})
            .center(boxSize/2, boxSize/2);
        text.node.id = this.parent.makeGateId(s,q) + "-t";
        SVG.get(this.parent.makeGateId(s,q)+"-c").replace(circle);
        SVG.get(this.parent.makeGateId(s,q)+"-t").replace(text);        
    }
}