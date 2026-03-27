const EventEmitter = require('events');

class EventBus extends EventEmitter {}

const eventBus = new EventBus();

// 이벤트 타입 상수
const EVENTS = {
  DONATION_VERIFIED: 'DonationVerified',
  CHARACTER_LEVELED_UP: 'CharacterLeveledUp',
  CHARACTER_STAGE_CHANGED: 'CharacterStageChanged',
};

module.exports = { eventBus, EVENTS };
