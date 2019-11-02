var bonoq = {
    generateCode: function(desc, circuit) {
        var lines = "operation " + desc.name + " (";
        if (desc.params) {
            for (var i = 0; i < desc.params.length; i++) {
                lines += desc.params[i] + ": Qubit";
                if (i < desc.params.length-1) {
                    lines += ", ";
                } 
            }
        } 
        lines += ") : Unit {\r\n";
        if (circuit.qubits.length > 0) {
            var usLine = "    using (";
            if (desc.qubits && desc.qubits.length > 0) {
                var hit = false;
                for (var q = 0; q < desc.qubits.length; q++) {
                    if (desc.params.indexOf(desc.qubits[q])<0) {
                        usLine += desc.qubits[q] + " = Qubit()";
                        usLine += ", ";
                        hit = true;
                    }
                }
                if (hit) {
                    usLine = usLine.substring(0, usLine.length-2);
                }
                usLine +=  ") {\r\n";
            } else {
                for (var q = 0; q < circuit.qubits.length; q++) {
                    usLine += "qubit" + (q+1) + " = Qubit()";
                    if (q != circuit.qubits.length-1) {
                        usLine += ", ";
                    } else {
                        usLine += ") {\r\n";
                    }
                }
            }
            lines += usLine;
            var varIndex = 1;
            for (var s = 0; s < circuit.stages.length; s++) {    
                for (var q = 0; q < circuit.qubits.length; q++) {
                    if (circuit.stages[s].gates[q]!= null) {
                        if (!circuit.stages[s].gates[q].isVisual && circuit.stages[s].gates[q].type!="Empty") {
                            if (circuit.stages[s].gates[q].isController && circuit.stages[s].gates[q].type == "C") {
                              lines += "        CNOT(" + this.getQubitname(desc, q) + ", " + this.getQubitname(desc, q+1) + ");\r\n";
                            } else if (circuit.stages[s].gates[q].controllerIndexes.length > 0) {

                            } else if (circuit.stages[s].gates[q].type == "Measure") {
                                lines += "        let data" + varIndex + " = M(" + this.getQubitname(desc, q) + ");\r\n";
                                varIndex++;
                            } else {
                               lines += "        " + circuit.stages[s].gates[q].type + "(" + this.getQubitname(desc, q) + ");\r\n";
                            }
                        }
                    }
                }
            }
            if (desc.name == "Teleport") {
                lines += "        if (data1 == One) { Z(target); }\r\n";
                lines += "        if (data2 == One) { X(target); }\r\n";
                lines += "        Reset(register);\r\n";
            }
            lines += "    }";
        }
        lines += "\r\n}";
        //return lines;
        return lines;
    },
    getQubitname: function(desc, q) {
        if (desc.qubits && q <= desc.qubits.length-1) {
            return desc.qubits[q];
        } else {
            return "qubit" + (q+1);
        }
    }
}