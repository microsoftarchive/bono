var bono = require('./bono.js')
//////////////////////////////////////// Complex number tests ////////////////////////////////////////
function test_complex_number_add() {
    var a = new bono.Complex(0.3, 0.4);
    var b = new bono.Complex(0.5, 0.6);
    var c = a.add(b);
    return assert(c.a == 0.8 && c.b == 1.0, "Expected: 0.8 + 1.0i");
}
function test_complex_number_subtract() {
    var a = new bono.Complex(0.3, 0.4);
    var b = new bono.Complex(0.5, 0.6);
    var c = a.subtract(b);
    return assert(c.equals(new bono.Complex(-0.2,-0.2)), "Expected: -0.2 - 0.2i, Actual: " + c.toString());
}
function test_complex_number_multiply() {
    var a = new bono.Complex(0.3, 0.4);
    var b = new bono.Complex(0.5, 0.6);
    var c = a.multiply(b);
    return assert(c.equals(new bono.Complex(-0.09,0.38)), "Expected: -0.09 + 0.38i, Actual: " + c.toString());
}
function test_complex_number_multiply_i() {
    var a = new bono.Complex(0.707, 0);
    var b = new bono.Complex(0, 1);
    var c = a.multiply(b);
    return assert(c.equals(new bono.Complex(0,0.707)), "Expected: 0 + 0.707i, Actual: " + c.toString());
}
function test_complex_number_multiply_add() {
    var a = new bono.Complex(0.707, 0);
    var b = new bono.Complex(0, 1);
    var c = new bono.Complex(0.707, 0);
    var d = c.add(a.multiply(b));
    return assert(d.equals(new bono.Complex(0.707,0.707)), "Expected: 0.707 + 0.707i, Actual: " + d.toString());
}
function test_complex_number_phase() {
    ret = "";
    var a = new bono.Complex(1, 0);
    ret += assert(bono.isAbout(a.phase(), 0), "Expected: 0, Actual: " + a.phase());
    a = new bono.Complex(0,1);
    ret += assert(bono.isAbout(a.phase(), Math.PI/2), "Expected: PI/2, Actual: " + a.phase());
    return ret;
}

function complex_number_tests() {
    var result = "";
    result += test_complex_number_add();
    result += test_complex_number_subtract();
    result += test_complex_number_multiply();
    result += test_complex_number_multiply_i();
    result += test_complex_number_multiply_add();
    result += test_complex_number_phase();
    return result;
}

//////////////////////////////////////// Qubit tests ////////////////////////////////////////
function small_endian_2_test() {
    var a = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(2,0)]);
    var b = a.smallEndian();
    return assert(a.equals(b), "small_endian_2_test - 2-dimention vector should not change");
}
function small_endian_4_test() {
    var a = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(2,0),new bono.Complex(3,0),new bono.Complex(4,0)]);
    var b = a.smallEndian();
    var c = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(3,0),new bono.Complex(2,0),new bono.Complex(4,0)]);
    return assert(b.equals(c), "small_endian_4_test - 4-dimention vector (1,2,3,4) should change to (1,3,2,4)");
}
function small_endian_8_test() {
    var a = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(2,0),new bono.Complex(3,0),new bono.Complex(4,0),new bono.Complex(5,0),new bono.Complex(6,0),new bono.Complex(7,0),new bono.Complex(8,0)]);
    var b = a.smallEndian();
    var c = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(5,0),new bono.Complex(3,0),new bono.Complex(7,0),new bono.Complex(2,0),new bono.Complex(6,0),new bono.Complex(4,0),new bono.Complex(8,0)]);
    return assert(b.equals(c), "small_endian_8_test - 4-dimention vector (1,2,3,4,5,6,7,8) should change to (1,5,3,7,2,6,4,8)");
}

function qubit_tensor_tests() {
    var a = new bono.Qubit([new bono.Complex(0.707,0), new bono.Complex(0.707,0)]);
    var b = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    var c = a.tensor(b);
    return assert(c.equals(new bono.Qubit([new bono.Complex(0.707,0), new bono.Complex(0,0), new bono.Complex(0.707,0), new bono.Complex(0,0)])), "qubit_tensor_test() - Expected: (0.707, 0, 0.707, 0)");
}

function qubit_angles_H_tests() {
    var a = new bono.Qubit([new bono.Complex(0.707, 0), new bono.Complex(0.707, 0)]);
    ret = "";
    ret += assert(bono.isAbout(a.theta(), Math.PI/2), "Expected: PI/2, Actual: " + a.theta());
    ret += assert(bono.isAbout(a.phi(), 0), "Expected: 0, Actual: " + a.phi());
    return ret;
}

function qubit_angles_zero_tests() {
    var a = new bono.Qubit([new bono.Complex(1, 0), new bono.Complex(0, 0)]);
    ret = "";
    ret += assert(bono.isAbout(a.theta(), 0), "Expected: 0, Actual: " + a.theta());
    ret += assert(bono.isAbout(a.phi(), 0), "Expected: 0, Actual: " + a.phi());
    return ret;
}

function qubit_angles_one_tests() {
    var a = new bono.Qubit([new bono.Complex(0, 0), new bono.Complex(1, 0)]);
    ret = "";
    ret += assert(bono.isAbout(a.theta(), Math.PI), "Expected: PI, Actual: " + a.theta());
    ret += assert(bono.isAbout(a.phi(), 0), "Expected: 0, Actual: " + a.phi());
    return ret;
}

function qubit_angles_X_Y_quarter_tests() {
    var a = new bono.Qubit([new bono.Complex(-0.382683, 0), new bono.Complex(0.92388, 0)]);

    ret = "";
    ret += assert(bono.isAbout(a.theta(), Math.PI * 0.75), "Expected: 0.75PI, Actual: " + a.theta());
    ret += assert(bono.isAbout(a.phi(), Math.PI), "Expected: PI, Actual: " + a.phi());
    return ret;
}

function qubit_tests() {
    var result = "";
    result += small_endian_2_test();
    result += small_endian_4_test();
    result += small_endian_8_test();
    result += qubit_tensor_tests();
    result += qubit_angles_H_tests();
    result += qubit_angles_zero_tests();
    result += qubit_angles_one_tests();
    result += qubit_angles_X_Y_quarter_tests();
    return result;
}

//////////////////////////////////////// Matrix tests ////////////////////////////////////////
function matrix_identity_test() {
    var matrix = new bono.Matrix();
    return assert(matrix.size == 2 && matrix.toString() == "[ [1+0i, 0+0i], [0+0i, 1+0i] ]", "Expected " + matrix.toString());
}
function matrix_tensor_test() {
    var a = new bono.Matrix([[new bono.Complex(1, 0), new bono.Complex(2, 0)],[new bono.Complex(3, 0), new bono.Complex(4, 0)]]);
    var b = new bono.Matrix();
    var matrix = a.tensor(b);
    
    return assert(matrix.size == 4 && matrix.toString() == "[ [1+0i, 0+0i, 2+0i, 0+0i], [0+0i, 1+0i, 0+0i, 2+0i], [3+0i, 0+0i, 4+0i, 0+0i], [0+0i, 3+0i, 0+0i, 4+0i] ]", "Expected " + matrix.toString());
}
function matrix_cNot_test() {
    var matrix = new bono.Matrix().makeCNot(4);
    return assert(matrix.size == 4 && matrix.toString() == "[ [1+0i, 0+0i, 0+0i, 0+0i], [0+0i, 1+0i, 0+0i, 0+0i], [0+0i, 0+0i, 0+0i, 1+0i], [0+0i, 0+0i, 1+0i, 0+0i] ]", "Expected " + matrix.toString());
}

function matrix_tests() {
    var result = "";
    result += matrix_identity_test();
    result += matrix_tensor_test();
    result += matrix_cNot_test();
    return result;
}

//////////////////////////////////////// Circuit tests ////////////////////////////////////////
function single_H_test() {
    var circuit = new bono.Circuit();
    var stage = new bono.Stage([new bono.Gate("H")]);
    var qubit = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    circuit.stages.push(stage);
    circuit.qubits.push(qubit);
    circuit.evaluate();
    return assert(circuit.stages[0].outputs.length == 1 && 
        circuit.stages[0].outputs[0].smallEndian().equals(new bono.Qubit([new bono.Complex(0.707,0), 
                                                                       new bono.Complex(0.707,0)])), "single_H_test() - Expected: [0.707, 0.707]");
}
function single_X_test() {
    var circuit = new bono.Circuit();
    var stage = new bono.Stage([new bono.Gate("X")]);
    var qubit = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    circuit.stages.push(stage);
    circuit.qubits.push(qubit);
    circuit.evaluate();
    return assert(circuit.stages[0].outputs.length == 1 && 
        circuit.stages[0].outputs[0].smallEndian().equals(new bono.Qubit([new bono.Complex(0,0), 
                                                                       new bono.Complex(1,0)])), "single_X_test() - Expected: [0, 1]");
}
function single_X_with_circle_test() {
    var circuit = new bono.Circuit();
    var stage1 = new bono.Stage([new bono.Gate("X")]);
    var stage2 = new bono.Stage([new bono.Gate("Circle")]);
    var qubit = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.qubits.push(qubit);
    circuit.evaluate();
    var ret = assert(circuit.stages[1].outputs.length == 1 && 
        circuit.stages[1].outputs[0].smallEndian().equals(new bono.Qubit([new bono.Complex(0,0), 
                                                                       new bono.Complex(1,0)])), "single_X_with_circle_test() - Expected: [0, 1]");
    ret += assert(circuit.stages[1].gates[0].result.smallEndian().equals(new bono.Qubit([new bono.Complex(0,0), new bono.Complex(1,0)])), "single_X_with_circle_test() - Expected visual result: [0, 1]");
    return ret;
}
function single_H_with_sample_test() {
    var circuit = new bono.Circuit();
    var stage1 = new bono.Stage([new bono.Gate("H")]);
    var stage2 = new bono.Stage([new bono.Gate("Sample")]);
    var qubit = new bono.Qubit([new bono.Complex(1,0), new bono.Complex(0,0)]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.qubits.push(qubit);
    circuit.evaluate();
    var ret = assert(circuit.stages[1].outputs.length == 1 && 
        circuit.stages[1].outputs[0].smallEndian().equals(new bono.Qubit([new bono.Complex(0.707,0), 
                                                                       new bono.Complex(0.707,0)])), "single_X_with_circle_test() - Expected: [0.707, 0.707]");
    ret += assert(circuit.stages[1].gates[0].result.smallEndian().equals(new bono.Qubit([new bono.Complex(0.707,0), new bono.Complex(0.707,0)])), "single_X_with_circle_test() - Expected visual result: [0, 1]");
    return ret;
}
function single_H_cNot_two_qubits_test() {
    var circuit = new bono.Circuit();
    circuit.qubits = circuit.qubits.concat(bono.makeQubitArray(2));
    var stage1 = new bono.Stage([new bono.Gate("H"),new bono.Gate("Empty")]);
    var stage2 = new bono.Stage([new bono.Gate("C"), new bono.Gate("N")]);
    var stage3 = new bono.Stage([new bono.Gate("Qubit"), new bono.Gate("Qubit")]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.stages.push(stage3);
    circuit.evaluate();

    var ret = "";
    ret += assert(circuit.stages[2].gates[0].output.coefficients.length == 4, "single_H_cNot_two_qubits_test() - output 0 should show entangeled state");
    ret += assert(circuit.stages[2].gates[1].output.coefficients.length == 4, "single_H_cNot_two_qubits_test() - output 1 should show entangeled state");
    return ret;
}
function single_H_cNot_two_qubits_with_mcircle_test() {
    var circuit = new bono.Circuit();
    circuit.qubits = circuit.qubits.concat(bono.makeQubitArray(2));
    var stage1 = new bono.Stage([new bono.Gate("H"),new bono.Gate("Empty")]);
    var stage2 = new bono.Stage([new bono.Gate("C"), new bono.Gate("N")]);
    var stage3 = new bono.Stage([new bono.Gate("Qubit"), new bono.Gate("Qubit")]);
    var stage4 = new bono.Stage([new bono.Gate("MCircle"), new bono.Gate("Empty")]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.stages.push(stage3);
    circuit.stages.push(stage4);
    circuit.evaluate();

    var ret = "";
    ret += assert(circuit.stages[3].gates[0].output.coefficients.length == 4, "single_H_cNot_two_qubits_test() - output 0 should show entangeled state");
    ret += assert(circuit.stages[3].gates[1].output.coefficients.length == 4, "single_H_cNot_two_qubits_test() - output 1 should show entangeled state");
    return ret;
}

function rt_test() {
    var circuit = new bono.Circuit();
    circuit.qubits = circuit.qubits.concat(bono.makeQubitArray(1));
    var stage1 = new bono.Stage([new bono.Gate("H")]);
    var stage2 = new bono.Stage([new bono.Gate("Rt,0")]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.evaluate();

    var ret = "";
    ret += assert(circuit.stages[1].gates[0].output.equals(new bono.Qubit([new bono.Complex(0.707,0), new bono.Complex(0.707,0)])),"rt_test() - Expected: [0.707, 0.707]");
    //circuit.stages[1].updateGate(0, new bono.Gate("Rt,45"));
    circuit.stages[1].updateGateParameter(0, 0, 45); 
    circuit.evaluate();
    ret += assert(circuit.stages[1].gates[0].output.equals(new bono.Qubit([new bono.Complex(0.707,0), new bono.Complex(0.5,0.5)])), "rt_test() - Expected: [0.707, 0.5+0.5i]");
    return ret;
}

function circuit_tests() {
    var result = "";
    result += single_H_test();
    result += single_X_test();
    result += single_X_with_circle_test();
    result += single_H_with_sample_test();
    result += single_H_cNot_two_qubits_test();
    result += single_H_cNot_two_qubits_with_mcircle_test();
    result += rt_test();
    return result;
}

//////////////////////////////////////// Larger gates tests ////////////////////////////////////////
function teleport_test() {
    var circuit = new bono.Circuit();
    circuit.qubits = circuit.qubits.concat(bono.makeQubitArray(3));
    var stage1 = new bono.Stage([new bono.Gate("Empty"), new bono.Gate("H"), new bono.Gate("Empty")]);
    var stage2 = new bono.Stage([new bono.Gate("Empty"), new bono.Gate("C"), new bono.Gate("N")]);
    var stage3 = new bono.Stage([new bono.Gate("C"), new bono.Gate("N"), new bono.Gate("Empty")]);
    circuit.stages.push(stage1);
    circuit.stages.push(stage2);
    circuit.stages.push(stage3);
    circuit.evaluate();

    var ret = "";
    ret += assert(circuit.stages[1].combinedOutputs.smallEndian().equals(new bono.Qubit(
        [new bono.Complex(0.707,0),
         new bono.Complex(0,0), 
         new bono.Complex(0,0),
         new bono.Complex(0,0),
         new bono.Complex(0,0),
         new bono.Complex(0,0),
         new bono.Complex(0.707,0),
         new bono.Complex(0,0),])),"teleport_test() - Expected: [0.707, 0, 0, 0, 0, 0, 0.707, 0]");
    ret += assert(circuit.stages[2].combinedOutputs.smallEndian().equals(new bono.Qubit(
       [new bono.Complex(0.707,0),
        new bono.Complex(0,0), 
        new bono.Complex(0,0),
        new bono.Complex(0,0),
        new bono.Complex(0,0),
        new bono.Complex(0,0),
        new bono.Complex(0.707,0),
        new bono.Complex(0,0),])),"teleport_test() - Expected: [0.707, 0, 0, 0, 0, 0, 0.707, 0]");
    return ret;
}

function larger_gates_tests() {
    var result = "";
    result += teleport_test();
    return result;
}

////////////////////////////////////////////////////////////////////////////////
function assert(condition, message) {
    if (!condition) {
        return message + "\r\n";
    } else {
        return "";
    }
}    

function run_tests() {
    var result = "";
    result += complex_number_tests();
    result += qubit_tests();
    result += matrix_tests();
    result += circuit_tests();
    result += larger_gates_tests();
    result = result.trim();
    if (result.length == 0 ) {
        console.log("All tests passed!");
    } else {
        console.log(result);
    }
}


run_tests();