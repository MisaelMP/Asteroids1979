document.addEventListener("DOMContentLoaded", function() {
  // Handler when the DOM is fully loaded
  const FRICTION = 0.7; // friction coefficient of space 0 = no friction, 1 = friction
  const FPS = 30; // frames per second
  const GAME_LIVES = 3; // starting number of lives
  const LASER_DIST = 0.6; // max distance laser can travel as fraction of screen width
  const LASER_EXPLODE_DUR = 0.1 // duration of the laser's explosion in seconds
  const LASER_MAX = 10; // max number of laser on screen at once
  const LASER_SPD = 500; // speed of lasers in pixels per second
  const ROIDS_JAG = 0.3; // jaggedness of the asteroids 0 = 1, 1 = lots
  const ROIDS_NUM = 1; // Asteroids starting number
  const ROIDS_SIZE = 100; // Asteroids starting size of asteroids in pixels
  const ROIDS_SPD = 50; // max starting speed of asteroids in pixels per second
  const ROIDS_VERT = 10; // Average vertices on each asteroid
  const SHIP_BLINK_DUR = 0.3; // duration of the ship's blink during invisibility in seconds
  const SHIP_EXPLODE_DUR = 0.5; // Duration of the ship's explosion
  const SHIP_INV_DUR = 3; // duration of the ship invisibility in seconds
  const SHIP_SIZE = 30; // Ship height on pixels
  const SHIP_THRUST = 5; // acceleration of the ship in pixels per second
  const TURN_SPEED = 360; // turn speed in degrees per second
  const SHOW_CENTRE_DOT = false; // show or hide collision bounding
  const SHOW_BOUNDING = false;
  const TEXT_FADE_TIME = 2.5; // text fade in time
  const TEXT_SIZE = 40; // text size in pixels

  /** @type {HTMLCanvasElement}  */
  const canv = document.getElementById("gameCanvas");
  const ctx = canv.getContext("2d");

  // set up the game parameters
  let level, lives, roids, ship, text, textAlpha;
  newGame();

  // set up event handlers
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  // game loop

  setInterval(update, 1000 / FPS);
  function createAsteroidBelt() {
    roids = [];
    let x, y;
    for (let i = 0; i < ROIDS_NUM + level; i++) {
      do {
        x = Math.floor(Math.random() * canv.width);
        y = Math.floor(Math.random() * canv.height);
      } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    }
  }

  function destroyAsteroid(index) {
    let x = roids[index].x;
    let y = roids[index].y;
    let r = roids[index].r;

    // split the asteroid in two
    if (r === Math.ceil(ROIDS_SIZE / 2)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    } else if (r === Math.ceil(ROIDS_SIZE / 4)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    }

    // destroy the asteroid
    roids.splice(index, 1);

    // new level when no more asteroids
    if (roids.length == 0) {
      level++;
      newLevel();
    }
  }

  function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function drawShip(x, y, a, colour = "#ccbcbc") {
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo( // Ship nose
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
      );

    ctx.lineTo( // rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
      );

    ctx.lineTo( // rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
      );
    ctx.closePath();
    ctx.stroke();
  }

  function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  }

  function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
  }
  function keyDown(/** @type {keyboardEvent} */ ev) {

    if (ship.dead) {
      return;
    }

    switch (ev.keyCode) {
      case 32: // Space bar to shoot laser
        shootLaser();
        break;
      case 37: // left arrow to rotate ship left
        ship.rot = TURN_SPEED / 180 * Math.PI / FPS
        break;
      case 38: // up arrow to thrust the ship onwards
        ship.thrusting = true;
        break;
      case 39: // right arrow to rotate ship right
        ship.rot = -TURN_SPEED / 180 * Math.PI / FPS
        break;
    }
  }

  function keyUp(/** @type {keyboardEvent} */ ev) {

    if (ship.dead) {
      return;
    }

    switch (ev.keyCode) {
      case 32: // Space bar to allow shooting again
        ship.canShoot = true;
        break;
      case 37: // left arrow to STOP rotating ship left
        ship.rot = 0;
        break;
      case 38: // up arrow to STOP thrusting the ship onwards
        ship.thrusting = false;
        break;

      case 39: // right arrow to STOP rotating ship right
        ship.rot = 0;
        break;
    }
  }
  function newAsteroid(x, y, r) {
    const lvMult = 1 + 0.1 * level;
    const roid = {
      x: x,
      y: y,
      xv: Math.random() * ROIDS_SPD * lvMult / FPS * (Math.random() < 0.5 ? 1 : -1),
      yv: Math.random() * ROIDS_SPD  * lvMult / FPS * (Math.random() < 0.5 ? 1 : -1),
      a: Math.random() * Math.PI * 2, // In radians
      r:r,
      vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
      offs: []
    };

    // create the vertex offsets array
    for (let i = 0; i < roid.vert; i++) {
      roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
  }

  function newGame() {
    // set up ship object
    level = 0;
    lives = GAME_LIVES;
    ship = newShip();
    newLevel();
  }

  function newLevel() {
    text = `Level  ${level + 1}`;
    textAlpha = 1.0;
    createAsteroidBelt();
  }

  function newShip() {
    return {
      x: canv.width / 2,
      y: canv.height / 2,
      r: SHIP_SIZE / 2,
      a: 90 / 180 * Math.PI, // Convert to radians
      blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
      blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
      canShoot: true,
      dead: false,
      explodeTime: 0,
      lasers: [],
      rot: 0,
      thrusting: false,
      thrust: {
        x: 0,
        y: 0
      }
    }
  }

  function shootLaser() {
    // create the laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
      ship.lasers.push({ // from the nose of the ship
        x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
        y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
        xv: LASER_SPD * Math.cos(ship.a) / FPS,
        yv: -LASER_SPD * Math.sin(ship.a) / FPS,
        dist: 0,
        explodeTime: 0
      });
    }
    // prevent further shooting
    ship.canShoot = false;
  }

  function update() {
    const blinkOn = ship.blinkNum % 2 === 0;
    const exploding = ship.explodeTime > 0;
    // draw space
    ctx.fillStyle = "#251c1c";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // draw asteroids

    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
      ctx.strokeStyle = "#abb5bd";
      ctx.lineWidth = SHIP_SIZE / 20;
      // get the asteroid properties
      x = roids[i].x;
      y = roids[i].y;
      r = roids[i].r;
      a = roids[i].a;
      vert = roids[i].vert;
      offs = roids[i].offs;

      // draw a path
      ctx.beginPath();
      ctx.moveTo(
        x + r * offs[0] * Math.cos(a),
        y + r * offs[0] * Math.sin(a)
    );

      // draw the polygon
      for (let j = 1; j < vert; j++) {
        ctx.lineTo(
          x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
          y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
        );
      }
      ctx.closePath();
      ctx.stroke();

      if (SHOW_BOUNDING) {
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.stroke();
      }
    }

    // thrust the ship
    if (ship.thrusting && !ship.dead) {
      ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
      ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

      // draw the thruster
      if (!exploding && blinkOn) {
        ctx.fillStyle = "#bb320e";
        ctx.strokeStyle = "#e7dd60";
        ctx.lineWidth = SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo( // rear left
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a)));

        ctx.lineTo( // rear centre behind the ship
            ship.x - ship.r * 6 / 3 * Math.cos(ship.a), ship.y + ship.r * 6 / 3 * Math.sin(ship.a));

        ctx.lineTo( // rear right
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
      ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }

    // draw a triangular ship
    if (!exploding) {
      if (blinkOn && !ship.dead) {
        drawShip(ship.x, ship.y, ship.a);
      }

      // handle blinking
      if (ship.blinkNum > 0) {
        // reduce the blink time
        ship.blinkTime--;

        // reduce the blink num
        if (ship.blinkTime === 0) {
          ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
          ship.blinkNum--;
        }
      }
    } else {
      // Draw explosion
      ctx.fillStyle = "#7a0505";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "#ee1717";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "#f04f00";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "#eed10d";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "#f5edea";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
      ctx.fill();
    }

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "yellow";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
      ctx.stroke();
    }

    // ship's center dot
    if (SHOW_CENTRE_DOT) {
      ctx.fillStyle = 'tomato';
      ctx.fillRect(ship.x - 1, ship.y - 1, 8, 8);
    }

    // draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
      if ( ship.lasers[i].explodeTime === 0) {
          ctx.fillStyle = "#1f8645";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
          ctx.fill();
        } else {
          // draw the explosion
          ctx.fillStyle = "#d2411a";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.fillStyle = "#db8621";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
          ctx.fill();
          ctx.fillStyle = "#f08a96";
          ctx.beginPath();
          ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
          ctx.fill();
        }
    }

    // draw the game text
    if (textAlpha >= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle"
      ctx.fillStyle = `rgba(255, 255, 225, ${textAlpha})`;
      ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
      ctx.fillText(text, canv.width / 2, canv.height * 0.75);
      textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    } else if (ship.dead) {
      newGame();
    }

    // draw the player lives
    let lifeColour;
    for (let i = 0; i < lives; i++) {
      lifeColour = exploding && i == lives - 1 ? "#7a0505" : "#ccbcbc";
      drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2,   SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    // detect laser hits on asteroids
    let ax, ay, ar, lx, ly;
    for (let i = roids.length - 1; i >= 0; i--) {

      // grab asteroid properties
      ax = roids[i].x;
      ay = roids[i].y;
      ar = roids[i].r;

      // loop over the lasers
      for (let j = ship.lasers.length - 1; j >=0; j--) {

        // grab the laser properties
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detect hits
        if (ship.lasers[j].explodeTime === 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {

          // destroy the asteroid and activate the laser explosion
          destroyAsteroid(i);
          ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
          break;
        }
      }
    }

    // check for asteroids collisions
    if (!exploding) {
      if (ship.blinkNum === 0 && !ship.dead) {
        for (let i = 0; i < roids.length; i++) {
          if(distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
            explodeShip();
            destroyAsteroid(i);
            break;
          }
        }
      }
        // rotate ship
        ship.a += ship.rot;

        // move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } else {
       // reduce the explode time
        ship.explodeTime--;

        // reset the ship after the explosion
        if (ship.explodeTime === 0) {
          lives--;
          if (lives === 0) {
            gameOver();
          } else {
          ship = newShip();
          }
        }
    }
    // handle edge of screen
    if (ship.x < 0 - ship.r) {
      ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r) {
      ship.x = 0 - ship.r;
    }
    if (ship.y < 0 - ship.r) {
      ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r) {
      ship.y = 0 - ship.r;
    }

    // move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      // check distance travelled
      if (ship.lasers[i].dist > LASER_DIST * canv.width) {
        ship.lasers.splice(i, 1);
        continue;
      }

      // handle the explosion
      if (ship.lasers[i].explodeTime > 0) {
          ship.lasers[i].explodeTime--;

          // destroy the laser after the duration
          if (ship.lasers[i].explodeTime === 0) {
            ship.lasers.splice(i, 1);
            continue;
          }
      } else {
      //move laser
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      // calculate the distance travelled
      ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
      }
      // handle edge of screen
      if (ship.lasers[i].x < 0) {
        ship.lasers[i].x = canv.width;
      } else if (ship.lasers[i].x > canv.width) {
        ship.lasers[i].x = 0;
      }
      if (ship.lasers[i].y < 0) {
        ship.lasers[i].y = canv.height;
      } else if (ship.lasers[i].y > canv.height) {
        ship.lasers[i].y = 0;
      }
    }

    // move the Asteroids
    for (let i = 0; i < roids.length; i++) {
      roids[i].x += roids[i].xv;
      roids[i].y += roids[i].yv;

      // handle edge of screen
      if (roids[i].x < 0 - roids[i].r) {
        roids[i].x = canv.width + roids[i].r;
      } else if (roids[i].x > canv.width + roids[i].r) {
        roids[i].x = 0 - roids[i].r
      }
      if (roids[i].y < 0 - roids[i].r) {
        roids[i].y = canv.height + roids[i].r;
      } else if (roids[i].y > canv.height + roids[i].r) {
        roids[i].y = 0 - roids[i].r
      }
    }
}


});
