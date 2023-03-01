import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { A } from '@ember/array';
import move from 'ember-animated/motions/move';
import drag from '../utils/animations/drag';
import { set } from '@ember/object';
import { wait } from 'ember-animated';
import '../styles/my-addon.css';

export default class DragDropComponent extends Component {
  constructor() {
    super(...arguments);
    this.transition = this.transition.bind(this);
  }

  // Animation Duration
  duration = 200;
  // Waiting time for collison check to begin again
  waitForCollisionCheck = 300;
  watch = 'dragState';

  @tracked isDraggingItem = false;

  @tracked animationDuration = 200;
  @tracked waitForCollisionCheck = 300;
  @tracked minimumCollisionArea = 30;

  @tracked items = A(...[this.args.items]);

  setIsDraggingItem(boolean) {
    this.isDraggingItem = boolean;
  }

  @action handleInput(property, e) {
    const { value } = e.target;
    this[property] = Number(value);
  }

  mergeCardsAndDecks() {
    const items = [];
  }

  @action beginDragging(item, event) {
    const self = this;
    let dragState;
    function stopMouse() {
      set(item, 'dragState', null);
      item.isCollisionCheckStopped = null;
      window.removeEventListener('mouseup', stopMouse);
      window.removeEventListener('mousemove', updateMouse);
    }

    function updateMouse(event) {
      dragState.latestPointerX = event.x;
      dragState.latestPointerY = event.y;
      if (!this.isDraggingItem) self.setIsDraggingItem(true);
    }

    dragState = {
      initialPointerX: event.x,
      initialPointerY: event.y,
      latestPointerX: event.x,
      latestPointerY: event.y,
    };

    self.setIsDraggingItem(false);

    window.addEventListener('mouseup', stopMouse);
    window.addEventListener('mousemove', updateMouse);
    set(item, 'dragState', dragState);
    item.isCollisionCheckStopped = false;
  }

  updateItemPositionInArray = (selected, other) => {
    const item = selected;
    const indexOfOther = this.items.indexOf(other);
    this.items.removeObject(item);
    this.items.insertAt(indexOfOther, item);
  };

  *transition(sprites) {
    const { keptSprites } = sprites;
    const ref = this;

    const activeSprite = keptSprites.find(
      (sprite) => sprite.owner.value.dragState
    );

    let others = keptSprites.filter((sprite) => sprite !== activeSprite);

    if (activeSprite) {
      others = others.filter(
        (sprite) => sprite.owner.value.type === activeSprite.owner.value.type
      );
    }

    if (activeSprite) {
      drag(activeSprite, {
        others,
        onCollisionWaitFor: ref.waitForCollisionCheck,
        minimumAreaRequiredForCollision: ref.minimumCollisionArea,
        onCollision(otherSprite) {
          let activeModel = activeSprite.owner.value;
          let otherModel = otherSprite.owner.value;
          ref.updateItemPositionInArray(activeModel, otherModel);
        },
      });
    }

    yield wait(25);

    for (let sprite of others) {
      move(sprite);
    }
  }
}
