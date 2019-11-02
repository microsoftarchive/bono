var bono = {
    isAbout: function(a, b) {
        return Math.abs(a-b) <= 0.001;
    },   
    intPow2: function(p) {
        return Math.floor(Math.pow(2,p));
    },
    makeQubitArray: function(size) {
        var ret = new Array(size);
        for (var i = 0; i < size; i++) {
            ret[i] = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
        }
        return ret;
    },
    makeQubitRegister: function(size) {
        ret = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
        for (var i = 1; i < size; i++) {
            ret = ret.tensor(new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]));
        }
        return ret;
    },
    //----------------------------------------------------//
    createCircuit: function(circuitDesc) {
        var circuit = new bono.Circuit();
        for (var c = 0; c < circuitDesc.columns.length; c++) {
            var gate = [];
            for (var r = 0; r < circuitDesc.columns[c].length; r++) {     
                if (r >= circuit.qubits.length) {
                    var qubit = this.newQubit();
                    circuit.qubits.push(qubit);
                }
                gate.push(this.newGate(circuitDesc.columns[c][r]));
            }
            for (var m = circuitDesc.columns[c].length; m < circuit.qubits.length; m++) {
                gate.push(new this.newGate('Empty'));
            }
            circuit.stages.push(new bono.Stage(gate));
        }
        circuit.compact();
        if (circuitDesc.qubits && circuitDesc.qubits.length > 0 ) {
            for (var i = 0; i < circuitDesc.qubits.length; i++) {
                if (i < circuit.qubits.length) {
                    circuit.qubits[i].name = circuitDesc.qubits[i];
                }
            }
        }
        return circuit;
    },
    newQubit: function() {
        return new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    },
    newGate: function(type) {
        var g;
        var parts = type.split(",");
        switch (parts[0]) {
            case 'I':
            case 'H':
            case 'X':
            case 'Rt':
            case 'Ry':
            case 'Rx':
            case 'Rz':
            case 'Root':
            case 'C':
            case 'N':
            case 'Y':
            case 'Z':
            case 'Measure':
                g = new bono.Gate(type);
                break;
            case 'Classic':
                if (parts.length > 1) {
                    g = new ClassicGate(Number(parts[1]));
                    g.desc = type;
                } else {
                    g = new ClassicGate(0);
                }
                break;
            case 'Qubit':
            case 'Probability':
            case 'Circle':
            case 'MCircle':
            case 'Bloch':
            case 'Vector':
            case 'BarChart':
                g = new bono.Visual(type);
                break;
            case 'Sample':
                g = new bono.Sample(type);
                break;
            case 'Out-Message':
            case 'Out-Qubit':
                g= new bono.Output(type);
                break;
            default:
                g = new bono.Empty();
                break;
            }
        return g;
    },
}
bono.Stage = class Stage {
    constructor(gates) {
        this.gates = gates;
        this.outputs = [];
        this.combinedOutput = null;
        this.combinedMatrices = [];
        this.buildGateRelations();
        this.buildCombinedMatrix();
    }
    insertGate(index, newGate) {
        this.gates.splice(index, 0, newGate);
        this.combinedMatrices = [];
        this.buildGateRelations();
        this.buildCombinedMatrix();
    }
    addGate(newGate) {
        this.gates.push(newGate);
        this.combinedMatrices = [];
        this.buildGateRelations();
        this.buildCombinedMatrix();
    }
    updateGate(index,newGate) {
        this.gates.splice(index, 1, newGate);
        this.combinedMatrices = [];
        this.buildGateRelations();
        this.buildCombinedMatrix();
    }
    updateGateParameter(index, paramIndex, paramVal) {
        this.gates[index].updatePararms(0, paramVal); 
        this.combinedMatrices = [];
        this.buildGateRelations();
        this.buildCombinedMatrix();
    }
    evaluate(inputs) {
        this.outputs = [];
        var iIndex = 0;
        var gIndex = 0;
        var iCurrent = 0;
        var gCurrent = 0;
        this.inputs = new Array(inputs.length);
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i] = inputs[i].clone();
        }
    
        while (iIndex < this.inputs.length && gIndex < this.combinedMatrices.length) {
            if (this.inputs[iCurrent].coefficients.length == this.combinedMatrices[gCurrent].size) {
                this.outputs.push(this.combinedMatrices[gCurrent].multiply(this.inputs[iCurrent]));
                for (var i = iCurrent; i <= iIndex; i++) {
                    if (this.gates[i]) {
                        this.gates[i].output = this.outputs[this.outputs.length-1].clone();
                        this.gates[i].result = this.outputs[this.outputs.length-1].clone();
                    }
                }
                iIndex++;
                gIndex++;
                iCurrent=iIndex;
                gCurrent=gIndex;
            } else if (this.inputs[iCurrent].coefficients.length < this.combinedMatrices[gCurrent].size) {
               iIndex++;
               if (iIndex < this.inputs.length) {
                   this.inputs[iCurrent] = this.inputs[iCurrent].tensor(this.inputs[iIndex]);
               }
            } else {
                gIndex++;
                if (gIndex < this.combinedMatrices.length) {
                    this.combinedMatrices[gCurrent] = this.combinedMatrices[gCurrent].tensor(this.combinedMatrices[gIndex]); //.tensor(this.combinedMatrices[gCurrent]);
                }
            }
        }

        if (this.outputs.length > 0) {
            var gap = this.gates.length - this.outputs.length;
            var o = this.outputs[this.outputs.length-1].clone();
            for (var i = 0; i < gap; i++) {
                if (this.gates[i+this.outputs.length]) {
                    this.gates[i+this.outputs.length].output = o.clone();
                    this.gates[i+this.outputs.length].result = o.clone();
                }
            }
        }

        this.combinedOutputs = this.outputs[0];
        for (var i = 1; i < this.outputs.length; i++) {
            this.combinedOutputs = this.combinedOutputs.tensor(this.outputs[i]); //.tensor(this.combinedOutputs);
        }
        return this.outputs;
    }
    buildCombinedMatrix() {
        for (var i = 0; i < this.gates.length; i++) {
            if (!this.gates[i].isController && this.gates[i].controllerIndexes.length == 0) {
                this.combinedMatrices.push(this.gates[i].matrix);
            } else {
                if (this.gates[i].controllerIndexes.length >0) {
                    this.combinedMatrices.push(this.gates[i].matrix.makeCNot(bono.intPow2(this.gates[i].controllerIndexes.length+1)));
                }
            }
        }
    }
    buildGateRelations() {
        var gList = [];
        var cList = [];
        var lastType = "";
        for (var i = 0; i < this.gates.length; i++) {
            if (!this.gates[i]) {
                continue;
            }
            this.gates[i].isController = false;
            this.gates[i].controllerIndexes = [];
            switch (this.gates[i].type) {
                case "C":
                    if (cList.length == 0) {
                        cList.push([i])
                    } else {
                        cList[cList.length-1].push(i);
                    }
                    lastType = this.gates[i].type;
                    break;
                case "Measure":
                    break;
                case "Empty":
                    if (lastType != "C") {
                        cList.push([]);
                    }
                    break;
                default:
                    if (gList.length == 0) {
                        gList.push(i)
                    } else {
                        if (gList[gList.length-1] == i-1) {
                            gList[gList.length-1] = i;
                        } else {
                            gList.push(i);
                        }
                    }
                    lastType = this.gates[i].type;
                    break;
            }
        }
        for (var i = 0; i < gList.length; i++) {
            if (cList.length-1 >= i) {
                this.gates[gList[i]].controllerIndexes = cList[i].slice(0);
                for (var j = 0; j < cList[i].length; j++) {
                    this.gates[cList[i][j]].isController = true;
                }
            }
        }
    }
}
bono.Circuit = class Circuit {
    constructor() {
        this.qubits = [];
        this.stages = [];
    }
    hashCode() {
        var desc = "[";
        for (var c = 0; c < this.stages.length; c++) {
            desc += "[";
            for (var q = 0; q < this.stages[c].gates.length; q++) {
                if (this.stages[c].gates[q]) {
                    desc += "\"" + this.stages[c].gates[q].desc + "\""
                    if (q != this.stages[c].gates.length-1) {
                        desc += ",";
                    }
                }
            }
            desc += "]";
            if (this.stages[c] && c != this.stages[c].gates.length-1) {
                desc += ",";
            }
        }
        desc += "]";
        return desc.hashCode();
    }
    clone() {
        var ret = new bono.Circuit();
        for (var c = 0; c < this.stages.length; c++) {
            var gate = [];
            for (var r = 0; r < this.stages[c].gates.length; r++) {     
                var newGate = bono.newGate(this.stages[c].gates[r].desc);
                this.stages[c].gates[r].clone(newGate);
                gate.push(newGate);
            }
            ret.stages.push(new bono.Stage(gate));
        }
        for (var qi = 0; qi < this.qubits.length; qi++) {
            ret.qubits.push(this.qubits[qi].clone());
        }
        return ret;
    }
    removeEmptyGates() {
        for (var c = this.stages.length-2; c >= 0; c--) {
            if (this.stages[c].gates.length == 0) {
                this.stages.splice(c,1);
                continue;
            }
            var canRemove = true;
            for (var r = 0; r < this.stages[c].gates.length; r++) {
                if (this.stages[c].gates[r]!= null && this.stages[c].gates[r].type != "Empty") {
                    canRemove = false;
                    break;
                }
            }
            if (canRemove) {
                this.stages.splice(c,1);
            }
        }
    }
    removeEmptyQubits() {
        for (var q = this.qubits.length-1; q >= 0; q--) {
            var canRemove = true;
            for (var c = 0; c < this.stages.length; c++) {
                if (this.stages[c] && this.stages[c].gates.length-1 >= q && this.stages[c].gates[q] != null && this.stages[c].gates[q].type != "Empty") {
                    canRemove = false;
                    if (this.stages[c].gates[q].isClassic) {
                        this.qubits[q].isClassic = true;
                    }
                }
            }
            if (canRemove) {
                this.qubits.splice(q,1);
                for (var c = 0; c <this.stages.length; c++) {
                    if (this.stages[c].gates.length-1 >= q) {
                        this.stages[c].gates.splice(q,1);
                    }
                }
            }
        }
    }
    resetLinks() {
         for (var s = 0; s < this.stages.length; s++) {
             if (this.stages[s]) {
            for (var q = 0; q < this.stages[s].gates.length; q++) {
                if (this.stages[s].gates[q]) {
                    this.stages[s].gates[q].colIndex = s;
                    this.stages[s].gates[q].rowIndex = q;
                    this.stages[s].gates[q].isControl = false;
                    this.stages[s].gates[q].controllerIndexes = [];
                    this.stages[s].gates[q].controllerType = '';
                }
            }
        }
        }
    }
    recreateLinks() {
        for (var s = 0; s < this.stages.length; s++) {
            if (this.stages[s]) {
                var nList = [];
                var cList = [];
                var inCStream = false;
                var inMStream = false;
                var mSpot = -1;
                var mcSpot = -1;
                for (var q = 0; q < this.stages[s].gates.length; q++) {
                    if (this.stages[s].gates[q] == null) {
                        continue;
                    }
                    if (this.stages[s].gates[q].type == "N") {
                        if (inMStream && mcSpot < 0) {
                            mcSpot = q;
                            inMStream = false;
                        } else {
                            nList.push(q);
                        }
                    } else if (this.stages[s].gates[q].type == "C") {
                        if (inCStream) {
                            cList[cList.length-1].push(q);
                        } else {
                            inCStream = true;
                            cList.push([q]);
                        }
                    } else if (this.stages[s].gates[q].type == "Measure") {
                        inMStream = true;
                        mSpot = q;
                    } else {
                        if (this.stages[s].gates[q] != null && this.stages[s].gates[q].type != "Empty") {
                            inCStream = false;
                            if (inMStream && mcSpot < 0) {
                                mcSpot = q;
                                inMStream = false;
                            }
                        }
                    }
                }
                if (mSpot >= 0 && mcSpot >= 0) {
                    this.stages[s].gates[mcSpot].controllerIndexes = [mSpot];
                    this.stages[s].gates[mcSpot].controllerType = "Measure";
                    this.stages[s].gates[mSpot].isControl = true;
                }
                var cIndex = 0;
                for (var n = 0; n < nList.length; n++) {
                    if (n <= cList.length-1) {
                        this.stages[s].gates[nList[n]].controllerIndexes = cList[n].slice(0).sort();
                        this.stages[s].gates[nList[n]].controllerType = "C";

                        this.qubits[nList[n]].entangle(cList[n]);
                        this.qubits[nList[n]].entangle([nList[n]]);
                        var allEntangled = [];
                        for (var i = 0; i < this.qubits[nList[n]].entangled.length; i++)
                         {
                             allEntangled = allEntangled.concat(this.qubits[this.qubits[nList[n]].entangled[i]].entangled);
                         }
                         for (var i = 0; i < allEntangled.length; i++)
                         { 
                             this.qubits[allEntangled[i]].entangle(allEntangled);
                         }

                        for (var i = 0; i < cList[n].length; i++) {
                            this.stages[s].gates[cList[n][i]].isControl = true;
                        }
                    }
                }
            }
        }
    }
    assignRegisters() {
        var register = 0;
        for (var qi = 0; qi < this.qubits.length; qi++) {
            if (this.qubits[qi].register < 0) {
                this.qubits[qi].register = register;
                for (var i = 0; i < this.qubits[qi].entangled.length; i++) {
                    this.qubits[this.qubits[qi].entangled[i]].register = register;
                }
                register++;
            }
        }
    }
    compact() {
        this.removeEmptyGates();
        this.removeEmptyQubits();
        this.resetLinks();
        this.recreateLinks();
        this.assignRegisters();
        for (var s = 0; s < this.stages.length; s++) {
            var gap = this.qubits.length - this.stages[s].gates.length;
            for (var i = 0; i < gap; i++) {
                this.stages[s].addGate(new bono.Gate("Empty"));
            }
        }
    }
    evaluate() {
        var result = bono.makeQubitArray(this.qubits.length);
        for (var i = 0; i < this.stages.length; i++) {
            result = this.stages[i].evaluate(result);
        }
    }
}
bono.Qubit = class Qubit {
    constructor(coeffs){
        this.coefficients = [];
        this.entangled = [];
        this.register = -1;
        this.name = "";
        for (var i = 0; i < coeffs.length; i++) {
            this.coefficients.push(coeffs[i].clone())
        }
    }
    clone() {   //Our qubit can be copied!
        var ret = new bono.Qubit(this.coefficients);
        ret.entangled = this.entangled.slice(0);
        ret.register = this.register;
        return ret;
    }
    entangle(list) {
        this.entangled = this.entangled.concat(list);
        this.entangled = this.entangled.filter(function(value, index, self) { 
            return self.indexOf(value) === index;
        });
        this.entangled.sort();
    }
    tensor(other) {
        var coeffs = [];
        for (var i = 0; i < this.coefficients.length; i++) {
            for (var j = 0; j < other.coefficients.length; j++) {
                coeffs.push(this.coefficients[i].multiply(other.coefficients[j]));
            }
        }
        return new bono.Qubit(coeffs);
    }
    toString() {
        var ret = "";
        for (var i = 0; i < this.coefficients.length; i++) {
            ret += this.coefficients[i].magnitude() + " ";
        }
        return ret;
    }
    equals(other) {
        if (this.coefficients.length != other.coefficients.length) {
            return false;
        }
        for (var i = 0; i < this.coefficients.length; i++) {
            if (!this.coefficients[i].equals(other.coefficients[i])) {
                return false;
            }
        }
        return true;
    }
    smallEndian(){
        var coeffs = new Array(this.coefficients.length);
        var m = Math.floor(Math.log2(this.coefficients.length));
        for (var i = 0; i < this.coefficients.length; i++) {
            var j = 0;
            for (var k = 1; k <=m; k++) {
                var p = Math.floor(i / bono.intPow2(k-1)) % 2;
                var n = p*bono.intPow2(m-k);
                j += n;
            }
            coeffs[j] = this.coefficients[i].clone();
        }
        return new bono.Qubit(coeffs);
    }
    theta() {
        ret = Math.acos(this.coefficients[0].a)*2;
        if (ret > Math.PI) {
            ret = Math.PI * 2 - ret;
        }
        return ret;
    }
    phi() {
        if (bono.isAbout(Math.sin(this.theta()/2), 0)) {
            if (this.theta() > Math.PI/2) {
                return Math.PI;
            } else {
                return 0;
            }
        } else {
            return Math.asin(this.coefficients[1].b / Math.sin(this.theta()/2));
        }
    }
}
bono.Complex = class Complex{
    constructor(a,b) {
        this.a = a;
        this.b = b;
    }
    multiply(other) {
        var newA = this.a * other.a - this.b * other.b;
        var newB = this.a * other.b + this.b * other.a;
        return new bono.Complex(newA, newB);
    }
    add(other) {
        return new bono.Complex(this.a + other.a, this.b + other.b);
    }
    subtract(other) {
       return new bono.Complex(this.a - other.a, this.b - other.b);
    }
    clone() {
        return new bono.Complex(this.a, this.b);
    }
    magnitude() {
        return Math.sqrt(this.a * this.a + this.b * this.b);
    }
    phase() {
        var angle = Math.atan2(this.b,this.a);
        return (angle + Math.PI * 2) % (Math.PI * 2);
    }
    toString(s) {
        if (s) {
            if (this.b >= 0) {
                return this.a.toFixed(s) + "+" + this.b.toFixed(s) + "i";
            } else {
                return this.a.toFixed(s) + "" + this.b.toFixed(s) + "i";
            }
        } else {
            if (this.b >= 0) {
                return this.a.toFixed(s) + "+" + this.b.toFixed(s) + "i";
            } else {
                return this.a.toFixed(s) + "" + this.b.toFixed(s) + "i";
            }
        }
    }
    toHTML() {
        if (bono.isAbout(this.b, 0)) {
            return this.toPrettyNumber(this.a);
        } else {
            if (bono.isAbout(this.b, 1)) {
                if (bono.isAbout(this.a, 0)) {
                    return "<i>i</i>";
                } else {
                    return this.toPrettyNumber(this.a) + "+<i>i</i>";
                }
            } else if (bono.isAbout(this.b, -1)) {
                if (bono.isAbout(this.a, 0)) {
                    return "-<i>i</i>";
                } else {
                    return this.toPrettyNumber(this.a) + "-<i>i</i>";
                }
            }else if (this.b >= 0) {
                return this.toPrettyNumber(this.a) + "+" + this.toPrettyNumber(this.b) + "<i>i</i>";
            } else {
                return this.toPrettyNumber(this.a) + "" + this.toPrettyNumber(this.b) + "<i>i</i>";
            }
        }
    }
    toPrettyNumber(a) {
        if (bono.isAbout(a, 1/Math.sqrt(2))) {
            return '1/<span style="white-space: nowrap; font-size:larger">&radic;<span style="text-decoration:overline;font-size:smaller">&nbsp;2&nbsp;</span></span>';
        } else if (bono.isAbout(a, -1/Math.sqrt(2))) {
            return '-1/<span style="white-space: nowrap; font-size:larger">&radic;<span style="text-decoration:overline;font-size:smaller">&nbsp;2&nbsp;</span></span>';
        }
        return a;
    }
    equals(other) {
        return bono.isAbout(this.a, other.a) && bono.isAbout(this.b, other.b);
    }
}
bono.Gate = class Gate {
    constructor(desc) {
        this.input = null;
        this.output = null;
        this.result = null;
        this.isVisual = false;
        this.isControl = false;
        this.isOutput = false;
        this.controllerIndexes = [];
        this.colIndex = -1;
        this.rowIndex = -1;
        this.error = '';
        this.isClassic = false;
        this.controllerType = '';
        this.setDescription(desc);
    }
    updatePararms(index, value) {
        this.parameters[index] = value;
        this.setDescription(this.type + "," + this.parameters.join(','));
    }
    setDescription(desc) {
        this.desc = desc;
        var parts = this.desc.split(",");
        this.type = parts[0];
        this.parameters = parts.slice(1);
        switch(this.type) {
            case "H":
                this.matrix = new bono.Matrix([[new bono.Complex(1/Math.sqrt(2),0),new bono.Complex(1/Math.sqrt(2),0)],[new bono.Complex(1/Math.sqrt(2),0),new bono.Complex(-1/Math.sqrt(2), 0)]]);
                break;
            case "X":
                this.matrix = new bono.Matrix([[new bono.Complex(0,0),new bono.Complex(1,0)],[new bono.Complex(1,0),new bono.Complex(0, 0)]]);
                break;
            case "Rt":
                var angle = parseFloat(this.parameters[0]) * Math.PI / 180.0;
                this.matrix = new bono.Matrix([[new bono.Complex(1,0),new bono.Complex(0,0)],[new bono.Complex(0,0),new bono.Complex(Math.cos(angle), Math.sin(angle))]]);
                break;
            case "Rx":
                var angle = parseFloat(this.parameters[0]) * Math.PI / 360.0;
                this.matrix = new bono.Matrix([[new bono.Complex(Math.cos(angle),0),new bono.Complex(0,-Math.sin(angle))],[new bono.Complex(0,-Math.sin(angle)),new bono.Complex(Math.cos(angle), 0)]]);
                break;
            case "Ry":
                var angle = parseFloat(this.parameters[0]) * Math.PI / 360.0;
                this.matrix = new bono.Matrix([[new bono.Complex(Math.cos(angle),0),new bono.Complex(-Math.sin(angle),0)],[new bono.Complex(Math.sin(angle),0),new bono.Complex(Math.cos(angle), 0)]]);
                break;
            case "Rz":
                var angle = parseFloat(this.parameters[0]) * Math.PI / 360.0;
                this.matrix = new bono.Matrix([[new bono.Complex(Math.cos(angle),Math.sin(angle)),new bono.Complex(0,0)],[new bono.Complex(0,0),new bono.Complex(Math.cos(angle), Math.sin(angle))]]);
                break;
            case "Root":
                this.matrix = new bono.Matrix([[new bono.Complex(0.5,0.5),new bono.Complex(0.5,-0.5)],[new bono.Complex(0.5,-0.5),new bono.Complex(0.5, 0.5)]]);
                break;
            case "N":
                this.matrix = new bono.Matrix([[new bono.Complex(0,0),new bono.Complex(1,0)],[new bono.Complex(1,0),new bono.Complex(0, 0)]]);
                break;
            case "Z":
                this.matrix = new bono.Matrix([[new bono.Complex(1,0),new bono.Complex(0,0)],[new bono.Complex(0,0),new bono.Complex(-1, 0)]]);  //[1     0]
                break;                                                                                              //[0    -1]
            case "Y":
                this.matrix = new bono.Matrix([[new bono.Complex(0,0),new bono.Complex(0,-1)],[new bono.Complex(0,1),new bono.Complex(0, 0)]]); //[0    -i]
                break;                                                                                              //[i     0]
            default:
                this.matrix = new bono.Matrix([[new bono.Complex(1,0),new bono.Complex(0,0)],[new bono.Complex(0,0),new bono.Complex(1, 0)]]);
                break;
        }
    }
    clone(other) {
        other.type = this.type;
        other.desc = this.desc;
        other.matrix = this.matrix.clone();
        other.input = this.input;
        other.output = this.input;
        other.result = this.result;
        other.isVisual = this.isVisual;
        other.isOutput = this.isOutput;
        other.isControl = this.isControl;
        other.controllerIndexes = this.controllerIndexes.slice(0);
        other.colIndex = this.colIndex;
        other.rowIndex = this.rowIndex;
        other.error = this.error;
        other.isClassic = this.isClassic;
        other.parameters = this.parameters.slice(0);
        other.controllerType = this.controllerType;
    }
    evaluate(input, circuit) {
        if (input == null)
            return;
        this.input = input.clone();
        if (this.type == "Empty") {
            this.output = this.input.clone();
            this.result = this.input.clone();
            return;
        }
        var tmpMatrix = null;
        if (this.matrix.size != this.input.coefficients.length) {
            if (this.controllerIndexes.length > 0) {
                tmpMatrix = this.matrix.makeCNot(this.input.coefficients.length);
            } else if (!this.isControl) {
                if (circuit.qubits[this.rowIndex].entangled.length != 0) {
                    tmpMatrix = circuit.stages[this.colIndex].gates[circuit.qubits[this.rowIndex].entangled[0]].matrix;
                    for (var i = 1; i < circuit.qubits[this.rowIndex].entangled.length; i++) {
                        tmpMatrix = circuit.stages[this.colIndex].gates[circuit.qubits[this.rowIndex].entangled[i]].matrix.tensor(tmpMatrix);
                    }
                } else {
                    tmpMatrix = this.matrix.selfMultiply(Math.floor(Math.log2(this.input.coefficients.length / this.matrix.size)));
                }
            } else {
                tmpMatrix = this.matrix.makeIdentity(this.input.coefficients.length);
            }
        } else {
            tmpMatrix = this.matrix.clone();
        }
        if (tmpMatrix.size != this.input.coefficients.length) {
            throw "mismatch:\r\n\tMatrix size: " + tmpMatrix.size 
                    + "\r\n\tInput size: " + this.input.coefficients.length 
                    + "\r\n\tGate: " + this.desc
                    + "\r\n\tEntangled: " + circuit.qubits[this.rowIndex].entangled;
        }
        this.error = '';
        this.output = new bono.Qubit(this.input.coefficients);
        this.result = new bono.Qubit(this.input.coefficients);
        for (var i = 0; i < this.input.coefficients.length; i++) {
            this.output.coefficients[i] = new bono.Complex(0,0);
            for (var j = 0; j < this.input.coefficients.length; j++) {
                this.output.coefficients[i] = this.output.coefficients[i].add(tmpMatrix.data[i][j].multiply(this.input.coefficients[j]));
            }
        }
        this.result = this.output.clone();
    }
}
bono.Matrix = class Matrix {
    constructor() {
        if (arguments[0]) {
            this.data = arguments[0];
            this.size= arguments[0].length;
        } else {
            return this.makeIdentity(2);
        }
    }
    clone() {
        var ret = [];
        for (var r = 0; r < this.size; r++) {
            ret.push([]);
            for (var c =0; c < this.size; c++) {
                ret[r].push(this.data[r][c].clone());
            }
        }
        return new bono.Matrix(ret);
    }
    selfTensor(repeat) {
        var ret = this;
        for (var i = 0; i < repeat; i++) {
            ret = ret.tensor(this);
        }
        return ret;
    }
    makeCNot(mSize) {
        var tmp = this.makeIdentity(mSize);
        tmp.data[mSize-1][mSize-1] = new bono.Complex(0,0);
        tmp.data[mSize-2][mSize-2] = new bono.Complex(0,0);
        tmp.data[mSize-2][mSize-1] = new bono.Complex(1,0);
        tmp.data[mSize-1][mSize-2] = new bono.Complex(1,0);
        return tmp;
    }
    makeIdentity(size) {
        var mData = [];
        for (var r = 0; r < size; r++) {
            mData.push([]);
            for (var c= 0; c < size; c++) {
                 if (r == c) {
                     mData[r].push(new bono.Complex(1,0));
                } else {
                     mData[r].push(new bono.Complex(0,0));
                }
            }
        }
        return new bono.Matrix(mData);
    }
    multiply(input) {
        var ret = [];
        for (var i = 0; i <this.size; i++) {
            var complex = new bono.Complex(0,0);
            for (var j = 0; j < this.size; j++) {
                complex = complex.add(this.data[i][j].multiply(input.coefficients[j]));
            }
            ret.push(complex);
        }
        return new bono.Qubit(ret);
    }
    tensor(other) {
        var mData = [];
        for (var r = 0; r < this.size * other.size; r++) {
            mData.push([]);
            for (var c = 0; c < this.size * other.size; c++) {
                mData[r].push(new bono.Complex(0,0));
            }
        }
        for (var r = 0; r < this.size; r++) {
            for (var c = 0; c < this.size; c++) {
                for (var r2 = 0; r2 < other.size; r2++) {
                    for (var c2 = 0; c2 < other.size; c2++) {
                       mData[r*other.size + r2][c*other.size + c2] = this.data[r][c].multiply(other.data[r2][c2])
                    }
                }

            }
        }
        return new bono.Matrix(mData);
    }
    toString() {
        var ret = "[ ";
        for (var r = 0; r < this.size; r++) {
            ret += "[";
            for (var c = 0; c < this.size; c++) {
                ret += this.data[r][c].toString();
                if (c < this.size-1) {
                    ret += ", "
                }
            }       
            ret += "]";
            if (r <this.size-1) {
                ret += ", "
            }
        }
        return ret +" ]";
    }
    toHTMLTable() {
        var ret = "<table>";
        for (var r = 0; r < this.size; r++) {
            ret += "<tr>";
            for (var c = 0; c < this.size; c++) {
                if (c == 0) {
                    ret += '<td class="left" nowrap>';
                } else if (c == this.size - 1) {
                    ret += '<td class="right" nowrap>';
                } else {
                    ret += "<td nowrap>";
                }
                ret += this.data[r][c].toHTML();
                ret += "</td>";
            }
            ret += "</tr>";
        }
        ret += "</table>";
        return ret;
    }
}
bono.Empty = class Empty extends bono.Gate {
    constructor() {
        super("Empty");
    }
    evaluate(input, circuit) {
        if (input == null)
            return;
        this.input = input.clone();
        this.output = new bono.Qubit(this.input.coefficients);
        this.result = new bono.Qubit(this.input.coefficients);
    }
}
class ClassicGate extends bono.Gate {
    constructor(bit){
        super("Classic");
        this.isClassic = true;
        this.updateParams(bit);
    }
    updateParams(bit) {
        this.bit = bit;
    }
    evaluate(input, circuit) {
        this.input = input.slice(0);
        this.output = [this.bit];
        this.result = [this.bit];
    }
}
bono.Visual = class Visual extends bono.Gate {
    constructor(desc) {
        super(desc);
        this.isVisual = true;
    }
    evaluate(input) {
        if (input == null)
            return;
        this.input = input.clone();
        this.output = this.input.clone();
        this.result = this.output.clone();
    }
}
bono.Sample = class Sample extends bono.Visual {
    evaluate(input, circuit) {
        super.evaluate(input);
        var mag = this.output.coefficients[0].magnitude();
        var rand = Math.random();
        if (rand <= mag * mag) {
            this.result.coefficients[0] = new bono.Complex(0,0);
        } else {
            this.result.coefficients[0] = new bono.Complex(1,0);
        }
    }
}
bono.Output = class Output extends bono.Visual {
    constructor(desc) {
        super(desc);
        this.isOutput = true;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = bono;
}