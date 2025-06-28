const screen = {
  inputScreen: document.querySelector(".top"),
  outputScreen: document.querySelector(".bottom"),
  inputArr: [],
  result: "",
  inputToScreen: function (button) {
    button === "⌫"
      ? this.removeLastCharacter()
      : (this.inputArr.push(button), (this.inputScreen.innerHTML = this.inputArr.join(""))) || "0";
  },
  removeLastCharacter: function () {
    this.inputArr.pop();
    this.inputScreen.innerHTML = this.inputArr.join("") || "0";
  },
  outputToScreen: function () {
    this.outputScreen.innerHTML = this.result;
  },
};
const token = {
  tokenArr: [],
  preUnaryArr: [],
  tokeniseNumbersAndOperators: function (inputArr) {
    this.preUnaryArr = [];
    let currNum = "";
    for (let i = 0; i < inputArr.length; i++) {
      currNum = tokenMethods._addToNumAccumulator(inputArr[i], currNum);
      if (tokenMethods._isArithmeticOperator(inputArr[i]) || tokenMethods._isParenthesis(inputArr[i])) {
        currNum = tokenMethods._pushAccumulatedNumberAndReset(currNum, this.preUnaryArr);
        tokenMethods._pushOperationToken(inputArr[i], this.preUnaryArr);
      }
    }
    tokenMethods._pushAccumulatedNumberAndReset(currNum, this.preUnaryArr);
  },
  implicitMultiplication: function (preUnaryArr) {
    for (let i = preUnaryArr.length - 1; i >= 0; i--) {
      const isCurrentNumber = isFinite(preUnaryArr[i]);
      const isNextNumber = isFinite(preUnaryArr[i + 1]);
      const isCurrentClosingParen = preUnaryArr[i] === ")";
      const isNextOpeningParen = preUnaryArr[i + 1] === "(";
      if (i < preUnaryArr.length - 1) {
        if (isCurrentNumber && isNextOpeningParen) {
          preUnaryArr.splice(i + 1, 0, "*");
        } else if (isCurrentClosingParen && isNextNumber) {
          preUnaryArr.splice(i + 1, 0, "*");
        } else if (isCurrentClosingParen && isNextOpeningParen) {
          preUnaryArr.splice(i + 1, 0, "*");
        }
      }
    }
  },
  handleUnaryMinus: function (preUnaryArr) {
    this.tokenArr = preUnaryArr;
    for (let i = this.tokenArr.length - 1; i >= 0; i--) {
      if (this.tokenArr[i] === "-") {
        if (i === 0) {
          tokenMethods._insertZeroBeforeUnaryMinus(i);
        } else if (
          tokenMethods._isAfterOpeningParenthesis(this.tokenArr[i - 1]) ||
          tokenMethods._isAfterArithmeticOperator(this.tokenArr[i - 1])
        ) {
          tokenMethods._insertZeroBeforeUnaryMinus(i);
        }
      }
    }
  },
};
const tokenMethods = {
  _isDigit: (x) => /\d/.test(x),
  _isFractionSymbol: (x) => x === CalcConsts.FRACTION_SYMBOL,
  _isNumberChar: (x) => tokenMethods._isDigit(x) || tokenMethods._isFractionSymbol(x),
  _isArithmeticOperator: (x) => CalcConsts.ARITHMETIC_OPERATORS.includes(x),
  _isParenthesis: (x) => x === CalcConsts.LEFT_PARENTHESIS_SYMBOL || x === CalcConsts.RIGHT_PARENTHESIS_SYMBOL,
  _addToNumAccumulator: function (char, currNum) {
    if (this._isNumberChar(char)) {
      return (currNum += char);
    }
    return currNum;
  },
  _pushAccumulatedNumberAndReset: function (currNum, preUnaryArr) {
    if (currNum !== "") {
      preUnaryArr.push(currNum);
    }
    return "";
  },
  _pushOperationToken: function (char, preUnaryArr) {
    preUnaryArr.push(char);
  },
  _isAfterOpeningParenthesis: (x) => x === CalcConsts.LEFT_PARENTHESIS_SYMBOL,
  _isAfterArithmeticOperator: (x) => CalcConsts.ARITHMETIC_OPERATORS.includes(x),
  _insertZeroBeforeUnaryMinus: (x) => token.tokenArr.splice(x, 0, "0"),
};
const syrpn = {
  outputQueue: [],
  opStack: [],
  numStack: [],
  convertToRPN: function (tokenArr) {
    this.outputQueue = [];
    this.opStack = [];

    for (let i = 0; i < tokenArr.length; i++) {
      if (isFinite(tokenArr[i])) {
        syrpnMethods._handleNumberRule(tokenArr[i]);
      } else if (CalcConsts.ARITHMETIC_OPERATORS.includes(tokenArr[i])) {
        syrpnMethods._handleOperatorRule(tokenArr[i]);
      } else if (tokenArr[i] === CalcConsts.LEFT_PARENTHESIS_SYMBOL) {
        syrpnMethods._handleLeftParenthesisRule(tokenArr[i]);
      } else if (tokenArr[i] === CalcConsts.RIGHT_PARENTHESIS_SYMBOL) {
        syrpnMethods._handleRightParenthesisRule(tokenArr[i]);
      } else {
        throw new Error("Invalid token!");
      }
    }

    while (this.opStack.length > 0) {
      if (this.opStack.at(-1) === CalcConsts.LEFT_PARENTHESIS_SYMBOL) {
        this.opStack.pop();
        throw new Error("Mismatched parentheses: No matching '(' found!");
      }
      this.outputQueue.push(this.opStack.pop());
    }
  },
  evaluateRPN: function (rpnTokenArr) {
    this.numStack = [];
    for (let i = 0; i < rpnTokenArr.length; i++) {
      isFinite(rpnTokenArr[i])
        ? this.numStack.push(rpnTokenArr[i])
        : syrpnMethods._evaluateOperandsWithOperator(rpnTokenArr[i]);
    }
    screen.result = this.numStack.pop();
  },
};
const syrpnMethods = {
  _handleNumberRule: (x) => syrpn.outputQueue.push(x),
  _handleOperatorRule: function (token) {
    while (syrpn.opStack.length > 0) {
      const opStackTop = syrpn.opStack.at(-1);
      const isOpStackTopOperator = CalcConsts.ARITHMETIC_OPERATORS.includes(opStackTop);
      // Condition A (isOpStackTopOperator) && B (opStackTop !== "(")
      if (isOpStackTopOperator && opStackTop !== CalcConsts.LEFT_PARENTHESIS_SYMBOL) {
        const opStackTopOperatorHasPrecedenceOverToken =
          CalcConsts.OPERATOR_PRECEDENCE[opStackTop] > CalcConsts.OPERATOR_PRECEDENCE[token];
        const opStackTopOperatorHasSamePrecedenceAsToken =
          CalcConsts.OPERATOR_PRECEDENCE[opStackTop] === CalcConsts.OPERATOR_PRECEDENCE[token];
        const tokenIsLeftAssociative = CalcConsts.OPERATOR_ASSOCIATIVITY[token] === "left";
        // Condition C
        if (
          opStackTopOperatorHasPrecedenceOverToken ||
          (opStackTopOperatorHasSamePrecedenceAsToken && tokenIsLeftAssociative)
        ) {
          syrpn.outputQueue.push(syrpn.opStack.pop()); // Given A && B && C, opStack is popped to outputQueue
        } else {
          break;
        }
      } else {
        break;
      }
    }
    syrpn.opStack.push(token);
  },
  _handleLeftParenthesisRule: (x) => syrpn.opStack.push(x),
  _handleRightParenthesisRule: function (token) {
    let leftParenFound = false;
    while (syrpn.opStack.length > 0) {
      const opStackTop = syrpn.opStack.at(-1);
      const isOpStackTopOperator = CalcConsts.ARITHMETIC_OPERATORS.includes(opStackTop);

      if (isOpStackTopOperator && opStackTop !== CalcConsts.LEFT_PARENTHESIS_SYMBOL) {
        syrpn.outputQueue.push(syrpn.opStack.pop());
      } else if (opStackTop === CalcConsts.LEFT_PARENTHESIS_SYMBOL) {
        syrpn.opStack.pop(); // this "(" is missing ")" pair, so popped off
        leftParenFound = true;
        break;
      } else {
        break;
      }
    }
    if (!leftParenFound) {
      throw new Error("Mismatched parentheses: No matching '(' found!  " + syrpn.outputQueue);
    }
  },
  _evaluateOperandsWithOperator: function (operator) {
    const [x, y] = syrpn.numStack.splice(-2, 2);
    const left = Number(x);
    const right = Number(y);
    switch (operator) {
      case "^":
        syrpn.numStack.push(Math.pow(left, right));
        break;
      case "*":
        syrpn.numStack.push(left * right);
        break;
      case "/":
        if (right === 0) {
          throw new Error("Division by zero!");
        }
        syrpn.numStack.push(left / right);
        break;
      case "+":
        syrpn.numStack.push(left + right);
        break;
      case "-":
        syrpn.numStack.push(left - right);
        break;
      default:
        throw new Error("Unknown operator in RPN: " + operator);
    }
  },
};
const CalcConsts = {
  EQUALS_SYMBOL: "=",
  BACKSPACE_SYMBOL: "⌫",
  FRACTION_SYMBOL: ".",
  LEFT_PARENTHESIS_SYMBOL: "(",
  RIGHT_PARENTHESIS_SYMBOL: ")",
  OPERATOR_PRECEDENCE: {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "^": 3,
  },
  OPERATOR_ASSOCIATIVITY: {
    "+": "left",
    "-": "left",
    "*": "left",
    "/": "left",
    "^": "right",
  },
  ALL_SYMBOLS: ["^", "*", "/", "+", "-", "(", ")", "⌫", "=", "."],
  ARITHMETIC_OPERATORS: ["+", "-", "*", "/", "^"],
  NUMBER_REGEX: /^-?\d+\.?\d*$/,
};
const io = {
  handledKeys: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "-",
    "*",
    "/",
    "^",
    "(",
    ")",
    ".",
    "Enter",
    "=",
    "Backspace",
    "Delete",
    "Escape",
  ],
  keyboard: function (key) {
    if (this.handledKeys.includes(key)) {
      orchestrator(key);
    }
    switch (key) {
      case ",":
        return orchestrator(CalcConsts.FRACTION_SYMBOL);
      case "Backspace":
        return orchestrator(CalcConsts.BACKSPACE_SYMBOL);
      case "Delete":
        return orchestrator(CalcConsts.BACKSPACE_SYMBOL);
      case "Delete":
        return orchestrator(CalcConsts.BACKSPACE_SYMBOL);
      default:
        break;
    }
  },
};
const game = {
  getRandomInt: function (minArg, maxArg) {
    const min = Math.ceil(minArg);
    const max = Math.floor(maxArg);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  allowedOperators: [],
  pickAllowedOperators: function () {
    const allowedOperatorNum = this.getRandomInt(1, CalcConsts.ARITHMETIC_OPERATORS.length);
    for (let i = 0; i < allowedOperatorNum; i++) {
      const op = CalcConsts.ARITHMETIC_OPERATORS[this.getRandomInt(0, CalcConsts.ARITHMETIC_OPERATORS.length - 1)];
      if (!game.allowedOperators.includes(op)) {
        game.allowedOperators.push(op);
        console.log("HELLO!: " + game.allowedOperators);
      }
    }
    console.log("allowedOperators: " + game.allowedOperators);
    console.log("allowedOperatorNum: " + allowedOperatorNum);
    return game.allowedOperators;
  },
  allowedNumOfCharForInput: 0,
  createAllowedNumOfCharForInput: () => (game.allowedNumOfCharForInput = game.getRandomInt(4, 10)),
  targetResult: 0,
  createTargetResult: () => game.targetResult = game.getRandomInt(10, 1000),
  startGame: function () {
    console.log("this opens");
    let timeLeft = 60;
    let isGameStarted = false;
    if (isGameStarted === false) {
      isGameStarted = true;

      document.getElementById("target-number").textContent = this.createTargetResult();
      document.getElementById("allowed-operators").textContent = this.pickAllowedOperators().join("  ");
      document.getElementById("allowed-chars").textContent = this.createAllowedNumOfCharForInput();
      document.getElementById("timer").textContent = timeLeft;
      const gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(gameTimer);
          game.endGame(false);
        }
      }, 1000);
    }
  },
  checkGameRules: function () {
    const targetResultLowerBound = this.targetResult * 0.99;
    const targetResultUpperBound = this. targetResult * 1.01;
    for (const token of screen.inputArr) {
      if (!this.allowedOperators.includes(token) && CalcConsts.ARITHMETIC_OPERATORS.includes(token)) {
        this.endGame(false);
      }
    }
    console.log("allowedNumOfCharForInput: " + this.allowedNumOfCharForInput);
    if (screen.inputScreen.innerHTML.length > this.allowedNumOfCharForInput) {
      this.endGame(false);
    }
    if (screen.result >= targetResultLowerBound && screen.result <= targetResultUpperBound) {
      this.endGame(true);
    }
  },
  endGame: function (win) {
    win ? alert("You won! Refresh page to try again!") : alert("You lost! Refresh page to try again!");
  },
};
const funny = {
  emojiCount: 0,
  emojiArr: ["=", "🙈", "🙉", "🐵", "🙊", "🐒"],
  equalsButtonOnCalc: document.getElementById("funny"),
  switchEmoji: function (button) {
    if (this.emojiArr.includes(button)) {
      console.log("funny opens: " + this.emojiCount);
      this.emojiCount++;
      this.equalsButtonOnCalc.innerHTML = this.emojiArr[this.emojiCount];
      if (this.emojiCount >= this.emojiArr.length - 1) {
        this.emojiCount = 0;
      }
    }
  },
};

game.startGame(); // runs only once

function orchestrator(button) {
  funny.switchEmoji(button);
  screen.inputToScreen(button);
  token.tokeniseNumbersAndOperators(screen.inputArr);
  token.implicitMultiplication(token.preUnaryArr);
  token.handleUnaryMinus(token.preUnaryArr);
  syrpn.convertToRPN(token.tokenArr);
  syrpn.evaluateRPN(syrpn.outputQueue);
  screen.outputToScreen();
  game.checkGameRules();
}
document
  .querySelectorAll("button")
  .forEach((button) => button.addEventListener("click", () => orchestrator(button.innerHTML)));
document.addEventListener("keydown", (event) => io.keyboard(event.key));

const test = {
  assertEquals: function (actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`);
      console.error("   Expected:", expected);
      console.error("   Actual:  ", actual);
    }
  },
  testTokeniseNumbersAndOperators: function () {
    console.log("\n--- Running tokeniseNumbersAndOperators Tests ---");

    // Test Case 1: Simple addition
    const input1 = ["2", "+", "3"];
    token.tokeniseNumbersAndOperators(input1);
    test.assertEquals(token.preUnaryArr, ["2", "+", "3"], "Should tokenize '2+3' correctly");

    // Test Case 2: Multi-digit number
    const input2 = ["1", "2", "3", "+", "4", "5", "6"];
    token.tokeniseNumbersAndOperators(input2);
    test.assertEquals(token.preUnaryArr, ["123", "+", "456"], "Should tokenize '123+456' correctly");

    // Test Case 3: Decimals (comma)
    const input3 = ["1", ".", "5", "*", "2"];
    token.tokeniseNumbersAndOperators(input3);
    test.assertEquals(token.preUnaryArr, ["1.5", "*", "2"], "Should tokenize '1.5*2' correctly");

    // Test Case 4: Parentheses and mixed operations
    const input4 = ["(", "1", "+", "2", ")", "*", "3"];
    token.tokeniseNumbersAndOperators(input4);
    test.assertEquals(token.preUnaryArr, ["(", "1", "+", "2", ")", "*", "3"], "Should tokenize '(1+2)*3' correctly");

    // Test Case 5: Operator at start (unary minus will be handled later, for now just tokenize)
    const input5 = ["-", "5", "+", "3"];
    token.tokeniseNumbersAndOperators(input5);
    // Based on current logic, '-' will be tokenized as an operator, not part of number
    test.assertEquals(
      token.preUnaryArr,
      ["-", "5", "+", "3"],
      "Should tokenize '-5+3' correctly (unary not handled here)"
    );

    // Test Case 6: Empty input
    const input6 = [];
    token.tokeniseNumbersAndOperators(input6);
    test.assertEquals(token.preUnaryArr, [], "Should tokenize empty input correctly");

    // Test Case 7: Only a number
    const input7 = ["1", "2", "3"];
    token.tokeniseNumbersAndOperators(input7);
    test.assertEquals(token.preUnaryArr, ["123"], "Should tokenize a single number correctly");

    console.log("--- Finished tokeniseNumbersAndOperators Tests ---");
  },
  testHandleUnaryMinus: function () {
    console.log("\n--- Running handleUnaryMinus Tests ---");

    // Test Case 8: First element is "-"
    const input8 = ["-", "5"];
    token.tokeniseNumbersAndOperators(input8);
    token.handleUnaryMinus(token.preUnaryArr);
    test.assertEquals(token.tokenArr, ["0", "-", "5"], 'Should add "0" before "-", -5');

    // Test Case 9: "-" follows an opening parenthesis
    const input9 = ["(", "-", "5", ")"];
    token.tokeniseNumbersAndOperators(input9);
    token.handleUnaryMinus(token.preUnaryArr);
    test.assertEquals(token.tokenArr, ["(", "0", "-", "5", ")"], 'Should add "0" before "-", (-5)');

    // Test Case 10: "-" follows an operator
    const input10 = ["2", "+", "-", "5"];
    token.tokeniseNumbersAndOperators(input10);
    token.handleUnaryMinus(token.preUnaryArr);
    test.assertEquals(token.tokenArr, ["2", "+", "0", "-", "5"], 'Should add "0" before "-", 2+-5');

    // Test Case 11: "-" is an operator and unaryHandling shouldn't activate
    const input11 = ["2", "-", "5"];
    token.tokeniseNumbersAndOperators(input11);
    token.handleUnaryMinus(token.preUnaryArr);
    test.assertEquals(token.tokenArr, ["2", "-", "5"], 'Should NOT add "0" before "-", 2-5');

    console.log("--- Finished handleUnaryMinus Tests ---");
  },
  testConvertToRPN: function () {
    console.log("\n--- Running convertToRPN Tests ---");

    function getShuntingYardInput(rawInputString) {
      token.tokeniseNumbersAndOperators(rawInputString.split(""));
      token.handleUnaryMinus(token.preUnaryArr);
      return token.tokenArr;
    }
    // Test Case 12: simple addition
    syrpn.convertToRPN(getShuntingYardInput("2+3"));
    test.assertEquals(syrpn.outputQueue, ["2", "3", "+"], `2+3: ${syrpn.outputQueue}`);

    // Test Case 13: Simple Subtraction (Unary Minus handled)
    syrpn.convertToRPN(getShuntingYardInput("-5+8"));
    test.assertEquals(syrpn.outputQueue, ["0", "5", "-", "8", "+"], `-5+8: ${syrpn.outputQueue}`);

    // Test Case 14: Addition and Multiplication (Precedence)
    syrpn.convertToRPN(getShuntingYardInput("2+3*4"));
    test.assertEquals(syrpn.outputQueue, ["2", "3", "4", "*", "+"], `2+3*4: ${syrpn.outputQueue}`);

    // Test Case 15: Parentheses
    syrpn.convertToRPN(getShuntingYardInput("(2+3)*4"));
    test.assertEquals(syrpn.outputQueue, ["2", "3", "+", "4", "*"], `(2+3)*4: ${syrpn.outputQueue}`);

    // Test Case 16: Complex "10+2*(5-3^2/9)-(4+6/(2+1))"
    console.log(getShuntingYardInput("10+2*(5-3^2/9)-(4+6/(2+1))"));
    syrpn.convertToRPN(getShuntingYardInput("10+2*(5-3^2/9)-(4+6/(2+1))"));
    console.log(syrpn.outputQueue);
    test.assertEquals(
      syrpn.outputQueue,
      ["10", "2", "5", "3", "2", "^", "9", "/", "-", "*", "+", "4", "6", "2", "1", "+", "/", "+", "-"],
      `"10 + 2 * (5 - 3^2 / 9) - (4 + 6 / (2 + 1))": ${syrpn.outputQueue}`
    );

    console.log("--- Finished convertToRPN Tests ---");
  },
  testEvaluateRPN: function () {
    console.log("\n--- Running evaluateRPN Tests ---");

    function getRPNInput(rawInputString) {
      token.tokeniseNumbersAndOperators(rawInputString.split(""));
      token.handleUnaryMinus(token.preUnaryArr);
      syrpn.convertToRPN(token.tokenArr);
      return syrpn.outputQueue;
    }
    // Test Case 17: simple addition
    syrpn.evaluateRPN(getRPNInput("2+3"));
    test.assertEquals(screen.result, 5, `2+3: ${screen.result}`);

    // Test Case 18: Simple Subtraction (Unary Minus handled)
    syrpn.evaluateRPN(getRPNInput("-5+8"));
    test.assertEquals(screen.result, 3, `-5+8: ${screen.result}`);

    // Test Case 19: Addition and Multiplication (Precedence)
    syrpn.evaluateRPN(getRPNInput("2+3*4"));
    test.assertEquals(screen.result, 14, `2+3*4: ${screen.result}`);

    // Test Case 20: Parentheses
    syrpn.evaluateRPN(getRPNInput("(2+3)*4"));
    test.assertEquals(screen.result, 20, `(2+3)*4: ${screen.result}`);

    // Test Case 21: Div by 0
    syrpn.evaluateRPN(getRPNInput("2/0"));
    test.assertEquals(screen.result, undefined, `2/0: ${screen.result}`);
    console.log("--- Finished evaluateRPN Tests ---");
  },
};

test.testTokeniseNumbersAndOperators();
test.testHandleUnaryMinus();
test.testConvertToRPN();
test.testEvaluateRPN();
