(function attachCharacterRules(globalScope) {
  function calculateCharacterSpeed(options = {}) {
    const baseSpeedValue = Number.parseFloat(options.baseSpeed);
    const race = String(options.race || '').trim();
    const elfLineage = String(options.elfLineage || '').trim();
    const className = String(options.className || '').trim();
    const level = Number.parseInt(options.level, 10);

    const hasRaceSpeedOverride = race === 'goliath'
      || (race === 'elf' && elfLineage === 'wood_elf');
    const baseSpeed = hasRaceSpeedOverride ? 35 : baseSpeedValue;
    if (!Number.isFinite(baseSpeed)) return '';

    const monkBonusApplies = className === 'monk'
      && Number.isFinite(level)
      && level >= 2
      && !options.isWearingArmor
      && !options.hasShield;
    const barbarianBonusApplies = className === 'barbarian'
      && Number.isFinite(level)
      && level >= 5
      && !options.isWearingHeavyArmor;

    return String(baseSpeed + ((monkBonusApplies || barbarianBonusApplies) ? 10 : 0));
  }

  globalScope.calculateCharacterSpeed = calculateCharacterSpeed;
})(window);
