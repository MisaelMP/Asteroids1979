document.addEventListener("DOMContentLoaded", function() {
  // Handler when the DOM is fully loaded
  const FRICTION = 0.7; // friction coefficient of space 0 = no friction, 1 = friction
  const FPS = 30; // frames per second
  const ROIDS_JAG = 0.3; // jaggedness of the asteroids 0 = 1, 1 = lots
  const ROIDS_NUM = 10; // Asteroids starting number
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

  /** @type {HTMLCanvasElement}  */
  const canv = document.getElementById("gameCanvas");
  const ctx = canv.getContext("2d");

  // set up ship object
  let ship = newShip();

  // construction of asteroids
  let roids = [];
  createAsteroidBelt();
  // set up event handlers
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  // game loop

  setInterval(update, 1000 / FPS);
  function createAsteroidBelt() {
    roids = [];
    let x, y;
    for (let i = 0; i < ROIDS_NUM; i++) {
      do {
        x = Math.floor(Math.random() * canv.width);
        y = Math.floor(Math.random() * canv.height);
      } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
      roids.push(newAsteroid(x, y));
    }
  }

  function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  }
  function keyDown(/** @type {keyboardEvent}*/
  ev) {
    switch (ev.keyCode) {
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

  function keyUp(/** @type {keyboardEvent}*/
  ev) {
    switch (ev.keyCode) {
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
  function newAsteroid(x, y) {
    const roid = {
      x: x,
      y: y,
      xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
      yv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
      a: Math.random() * Math.PI * 2, // In radians
      r: ROIDS_SIZE / 2,
      vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
      offs: []
    };

    // create the vertex offsets array
    for (let i = 0; i < roid.vert; i++) {
      roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
  }

  function newShip() {
    return {
      x: canv.width / 2,
      y: canv.height / 2,
      r: SHIP_SIZE / 2,
      a: 90 / 180 * Math.PI, // Convert to radians
      blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
      blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
      explodeTime: 0,
      rot: 0,
      thrusting: false,
      thrust: {
        x: 0,
        y: 0
      }
    }
  }

  function update() {
    const blinkOn = ship.blinkNum % 2 == 0;
    const exploding = ship.explodeTime > 0;
    // draw space
    ctx.fillStyle = "#251c1c";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // draw asteroids

    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
      ctx.strokeStyle = "#abb5bd";
      ctx.lineWidth = ROIDS_SIZE / 40;
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
    if (ship.thrusting) {
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
      if (blinkOn) {
        ctx.strokeStyle = "#ccbcbc";
        ctx.lineWidth = SHIP_SIZE / 20;
        ctx.beginPath();
        ctx.moveTo( // Ship nose
            ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            ship.y - 4 / 3 * ship.r * Math.sin(ship.a));

        ctx.lineTo( // rear left
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a)));

        ctx.lineTo( // rear right
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)), ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a)));
        ctx.closePath();
        ctx.stroke();
      }

      // handle blinking
      if (ship.blinkNum > 0) {
        // reduce the blink time
        ship.blinkTime--;

        // reduce the blink num
        if (ship.blinkTime == 0) {
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

    // center dot
    if (SHOW_CENTRE_DOT) {
      ctx.fillStyle = 'tomato';
      ctx.fillRect(ship.x - 1, ship.y - 1, 8, 8);
    }

    // check for asteroids collisions
    if (!exploding) {
      if (ship.blinkNum == 0) {
        for (let i = 0; i < roids.length; i++) {
          if(distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
            explodeShip();
          }
        }
      }
        // rotate ship
        ship.a += ship.rot;

        // move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } else {
        ship.explodeTime--;
        if (ship.explodeTime == 0) {
          ship = newShip();
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
