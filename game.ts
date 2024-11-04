let isRunning = false;

const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;
const UNIT_SIZE = 20;
const MIN_SNAKE_SIZE = 5;

type XY = [number, number];

let movement: XY = [0, 0];
let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

function drawBackground(context: CanvasRenderingContext2D) {
  for (let row = 0; row < GAME_WIDTH / UNIT_SIZE; row++) {
    for (let col = 0; col < GAME_HEIGHT / UNIT_SIZE; col++) {
      if ((row + col) % 2 === 0) {
        context.fillStyle = "#3f4364"; // Darker color
      } else {
        context.fillStyle = "#373b59"; // Lighter color
      }
      context.fillRect(col * UNIT_SIZE, row * UNIT_SIZE, UNIT_SIZE, UNIT_SIZE);
    }
  }
}

function createSnake() {
  let snake: XY[] = [];
  for (let i = 0; i < MIN_SNAKE_SIZE; i++) {
    snake.unshift([i === 0 ? 20 : UNIT_SIZE * i + 20, 20]);
  }
  return snake;
}
function drawSnake(context: CanvasRenderingContext2D, snake: XY[], partToRemove: [number, number] | undefined) {
  snake.forEach(([x, y], index) => {
    context.strokeStyle = '#000';
    context.strokeRect(x, y, UNIT_SIZE, UNIT_SIZE);
    if (index === 0) {
      context.fillStyle = '#00CC00';
    } else {
      context.fillStyle = '#33ff33';
    }
    context.fillRect(x, y, UNIT_SIZE, UNIT_SIZE);
  });
  if (partToRemove) {
    context.clearRect(...partToRemove, UNIT_SIZE, UNIT_SIZE);
  }
}

function getRandomNum(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) / UNIT_SIZE) * UNIT_SIZE;
}
function isFoodSpawnedInSnake(food: XY, snake: XY[]) {
  for (let part of snake) {
    const xMatch = part[0] === food[0];
    const yMatch = part[1] === part[1];
    if (xMatch && yMatch) {
      return true;
    }
  }
  return false;
}
function createFood(snake: XY[]): XY {
  const foodX = getRandomNum(0, GAME_WIDTH - UNIT_SIZE);
  const foodY = getRandomNum(0, GAME_HEIGHT - UNIT_SIZE);
  const food: XY = [foodX, foodY];

  const foodIsInvalid = isFoodSpawnedInSnake(food, snake);
  if (foodIsInvalid) {
    return createFood(snake);
  }
  return food;
}
function renderScore(score: number) {
  const el = document.getElementById('score') as HTMLSpanElement | null;
  if (!el) {
    throw new Error("Couldn't find the score board element with id 'score'");
  }
  el.innerHTML = `SCORE:${score}`;
}
function drawFood(context: CanvasRenderingContext2D, foodX: number, foodY: number) {
  context.fillStyle = 'brown';
  context.fillRect(foodX, foodY, UNIT_SIZE, UNIT_SIZE);
}

function clearCanvas(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function moveSnake(snake: XY[], currentFood: XY) {
  const [movementX, movementY] = movement;

  const allPartsExceptLast = snake.slice(0, -1);
  const lastPart = snake[snake.length - 1];

  const [firstPartX, firstPartY] = snake[0];
  const [secondPartX, secondPartY] = snake[1];

  function checkIfAteFood(snakeHead: XY, currentFood: XY) {
    const xMatch = snakeHead[0] === currentFood[0];
    const yMatch = snakeHead[1] === currentFood[1];
    return xMatch && yMatch;
  }
  function checkIfAteWall(snakeHead: XY) {
    const xMatch = snakeHead[0] < 0 || snakeHead[0] >= GAME_WIDTH;
    const yMatch = snakeHead[1] < 0 || snakeHead[1] >= GAME_HEIGHT;
    return xMatch || yMatch;
  }
  function checkIfAteOwnAss(snakeHead: XY, snake: XY[]) {
    // Given the head of the snake is it's first part,
    // note the snake can't eat it's second or third part,
    // this is because those parts are too close to the head,
    // and the head can't move around to get to them on the grid,
    // so we begin the checking at the 4th part (index #3)
    for (let i = 3; i < snake.length; i++) {
      const part = snake[i];
      const xMatch = snakeHead[0] === part[0];
      const yMatch = snakeHead[1] === part[1];
      if (xMatch && yMatch) {
        return true;
      }
    }
    return false;
  }
  function getNewSnake(partToAdd: XY) {
    const justAteFood = checkIfAteFood(partToAdd, currentFood);
    const justAteWall = checkIfAteWall(partToAdd);
    const justAteOwnAss = checkIfAteOwnAss(partToAdd, snake);
    const justFumbled = justAteWall || justAteOwnAss;

    const newSnake: XY[] = [partToAdd, ...allPartsExceptLast];

    return { newSnake, partToRemove: lastPart, justAteFood, justFumbled }
  }

  if (movementX > 0 && secondPartX !== firstPartX + UNIT_SIZE) {
    return getNewSnake([firstPartX + UNIT_SIZE, firstPartY]);
  }
  if (movementX < 0 && secondPartX !== firstPartX - UNIT_SIZE) {
    return getNewSnake([firstPartX - UNIT_SIZE, firstPartY]);
  }
  if (movementY > 0 && secondPartY !== firstPartY + UNIT_SIZE) {
    return getNewSnake([firstPartX, firstPartY + UNIT_SIZE]);
  }
  if (movementY < 0 && secondPartY !== firstPartY - UNIT_SIZE) {
    return getNewSnake([firstPartX, firstPartY - UNIT_SIZE]);
  }
  return { newSnake: snake, partToRemove: undefined, justAteFood: false, justFumbled: false };
}

function createGame(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  isRunning = true;

  const currentScore = 0;
  renderScore(currentScore);

  clearCanvas(context);
  drawBackground(context);

  const snake = createSnake();

  const currentFood = createFood(snake);
  drawFood(context, ...currentFood);

  nextTick(context, snake, currentFood, currentScore);
}
function nextTick(context: CanvasRenderingContext2D, snake: XY[], currentFood: XY, currentScore: number) {
  timeout = setTimeout(() => {
    if (!isRunning) {
      return;
    }
    const { newSnake, partToRemove, justAteFood, justFumbled } = moveSnake(snake, currentFood);
    if (justFumbled) {
      isRunning = false;
      window.alert(`Game over. Your score is ${currentScore}`);
      return;
    }
    let newScore = currentScore;
    let newFood = currentFood;
    if (justAteFood) {
      newScore = currentScore + 1;
      renderScore(newScore);

      newFood = createFood(newSnake);
      drawFood(context, ...newFood);
    }
    drawSnake(context, newSnake, partToRemove);
    nextTick(context, newSnake, newFood, newScore);
  }, 50);
}

(async () => {
  try {
    const canvas = document.getElementById('game') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error(`Canvas with id 'game' not found`);
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error("2D context is not supported");
    }

    context.fillStyle = "red";
    context.fillRect(50, 50, 100, 100);

    createGame(canvas, context);

    const resetButton = document.getElementById('resetGame') as HTMLButtonElement | null;
    if (!resetButton) {
      throw new Error("No button with id 'resetGame'")
    }
    resetButton.addEventListener('click', async (event) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      movement = [0, 0];
      createGame(canvas, context);
    });

    document.addEventListener('keyup', (event) => {
      if (!event.repeat) {
        switch (event.code) {
          case 'ArrowLeft':
            movement = movement[0] === 1 ? [1, 0] : [-1, 0];
            break;
          case 'ArrowRight':
            movement = movement[0] === -1 ? [-1, 0] : [1, 0];
            break;
          case 'ArrowUp':
            movement = movement[1] === 1 ? [0, 1] : [0, -1];
            break;
          case 'ArrowDown':
            movement = movement[1] === -1 ? [0, -1] : [0, 1];
            break;
          default:
            break;
        }
      }
    });

  } catch (error) {
    console.error("Error >>>", error, JSON.stringify(error, null, 2));
  }
})();