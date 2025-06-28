# syrpnCalc
[Try it out on codepen.io](https://codepen.io/GewGaw/pen/NPqqRbL)!

## What is it
Classic learn-to-code challenge, the calculator, with a "math game" twist. I used shunting-yard reverse polish notation (syrpn) as the calculator algorithm and implemented some quality of life additions, like implicit multiplication i.e., 2(2) = 4. 

## How it works
1. Each keypress calls the calculator loop listing all the stages
```js
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
```

2. The inputted key is displayed on screen (inputArr is state)
```js
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
```

3. Checks whether is number or operator/parenthesis and push to array (preUnaryArr is state)
```js
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
```

4. detect implicit multiplication condition and add * to as operator (preUnary is state) 
```js
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
```

5. detect unaryMinus (e.g., 2 + -5 -> "-" is unary) and insert zero (e.g., 2 + 0 - 5 -> "-5" becomes "-", "0", "5") (tokenArr is state) 
```js
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
```

6. convert tokenArr to outputQueue and opStack following Shunting-Yard (outputQueue is state)
```js
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
```

7. Evaluate outputQueue and show on result screen (result is state) 
```js
  evaluateRPN: function (rpnTokenArr) {
    this.numStack = [];
    for (let i = 0; i < rpnTokenArr.length; i++) {
      isFinite(rpnTokenArr[i])
        ? this.numStack.push(rpnTokenArr[i])
        : syrpnMethods._evaluateOperandsWithOperator(rpnTokenArr[i]);
    }
    screen.result = this.numStack.pop();
  },
```

8. Update results to screen
```js
  outputToScreen: function () {
    this.outputScreen.innerHTML = this.result;
  },
```


9. Check if result is within +/-1% of target result and if so, end game
```js
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
```

- Game randomises amount of characters allowed and operators allowed
 ```js
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
```
