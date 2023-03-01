import { Motion, rAF } from 'ember-animated';
import { later } from '@ember/runloop';

export default function drag(sprite, opts) {
  return new Drag(sprite, opts).run();
}

class Drag extends Motion {
  constructor(sprite, opts) {
    super(sprite, opts);
    this.prior = null;

    this.dragStartX = null;
    this.dragStartY = null;
  }

  interrupted(motions) {
    this.prior = motions.find((m) => m instanceof this.constructor);
  }

  *animate() {
    let sprite = this.sprite;
    let initialTx, initialTy;
    if (this.prior) {
      this.dragStartX = this.prior.dragStartX;
      this.dragStartY = this.prior.dragStartY;
      initialTx =
        sprite.transform.tx -
        sprite.absoluteInitialBounds.left +
        this.dragStartX;
      initialTy =
        sprite.transform.ty -
        sprite.absoluteInitialBounds.top +
        this.dragStartY;
    } else {
      this.dragStartX = sprite.absoluteInitialBounds.left;
      this.dragStartY = sprite.absoluteInitialBounds.top;
      initialTx = sprite.transform.tx;
      initialTy = sprite.transform.ty;
    }

    // targets are all in absolute screen coordinates
    let targets = this.opts.others.map((s) =>
      makeTarget(s.absoluteFinalBounds, s)
    );
    let ownTarget = makeTarget(sprite.absoluteFinalBounds, sprite);

    sprite.applyStyles({
      'z-index': '5',
    });

    while (sprite.owner.value.dragState) {
      let dragState = sprite.owner.value.dragState;

      // these track relative motion since the drag started
      let dx = dragState.latestPointerX - dragState.initialPointerX;
      let dy = dragState.latestPointerY - dragState.initialPointerY;

      // adjust our transform to match the latest relative mouse motion
      sprite.translate(
        dx + initialTx - sprite.transform.tx,
        dy + initialTy - sprite.transform.ty
      );

      const _itemValue = sprite.owner.value;

      if (!_itemValue.isCollisionCheckStopped) {
        let selectedTarget = checkForCollision(
          ownTarget,
          targets,
          this.opts.minimumAreaRequiredForCollision
        );
        if (selectedTarget) {
          _itemValue.isCollisionCheckStopped = true;
          this.opts.onCollision(selectedTarget.payload);
        }
        if (_itemValue.isCollisionCheckStopped) {
          yield later(
            _itemValue,
            function () {
              this.isCollisionCheckStopped = false;
            },
            this.opts.onCollisionWaitFor
          );
        }
      }

      yield rAF();
    }
  }
}

export function makeTarget(bounds, payload) {
  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
    payload,
  };
}

function didCollide(aSprite, bSprite) {
  const item1 = aSprite.element.getBoundingClientRect();

  const item2 = bSprite.element.getBoundingClientRect();

  const verticalMatch =
    (item2.top > item1.top && item2.top < item1.bottom) ||
    (item2.bottom > item1.top && item2.bottom < item1.bottom);

  const horizontalMatch =
    (item2.right > item1.left && item2.right < item1.right) ||
    (item2.left < item1.right && item2.left > item1.left);
  return horizontalMatch && verticalMatch;
}

function getAreaOfCollision(aSprite, bSprite) {
  const item1 = aSprite.element.getBoundingClientRect();

  const item2 = bSprite.element.getBoundingClientRect();

  const length =
    item1.left < item2.left
      ? item1.left + item1.width - item2.left
      : item2.left + item2.width - item1.left;
  const width =
    item1.top < item2.top
      ? item1.top + item1.height - item2.top
      : item2.top + item2.height - item1.top;

  return Math.abs(length * width);
}

function getAreaPrecentage(total, present) {
  return Math.floor((present / total) * 100);
}

function checkForCollision(ownTarget, targets, minAreaRequired) {
  let maxAreaTarget;
  let maxArea = -1;
  for (let i = 0; i < targets.length; i++) {
    let otherTarget = targets[i];
    if (didCollide(ownTarget.payload, otherTarget.payload)) {
      const area = getAreaOfCollision(ownTarget.payload, otherTarget.payload);
      if (area > maxArea) {
        maxArea = area;
        maxAreaTarget = otherTarget;
        const { width, height } = ownTarget.payload.absoluteFinalBounds;
        if (getAreaPrecentage(width * height, maxArea) > minAreaRequired) {
          return maxAreaTarget;
        }
      }
    }
  }
}
