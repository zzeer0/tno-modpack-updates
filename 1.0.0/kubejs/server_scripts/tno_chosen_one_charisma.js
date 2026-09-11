// Neo Otherworld - Chosen One (Hero's Charisma) em monstros comuns
// O Tensura e os addons colocam em tensura:no_charisma quase todo monstro que luta.
// Aqui tiramos da tag so os monstros comuns. Continuam bloqueados:
//  - bosses (entram pela sub-tag #tensura:boss_for_hero / c:bosses, que nao e mexida)
//  - mini-bosses (warden, elder guardian, dragoes/hydra/gorgon/cyclops/sea serpent/dread lich do Ice and Fire)
//  - daemons, personagens da historia do Tensura e os gacha do Beyond Adventures
//  - partes de mobs grandes (_body), clones, jogadores e entidades nao-vivas
// Os mobs liberados ganham seguir/vaguear/ficar e modos de luta pelo mod tno_subordinates.

ServerEvents.tags('entity_type', event => {
    event.remove('tensura:no_charisma', [
        // vanilla
        'minecraft:blaze',
        'minecraft:bogged',
        'minecraft:breeze',
        'minecraft:creeper',
        'minecraft:drowned',
        'minecraft:endermite',
        'minecraft:ghast',
        'minecraft:guardian',
        'minecraft:hoglin',
        'minecraft:husk',
        'minecraft:magma_cube',
        'minecraft:piglin_brute',
        'minecraft:ravager',
        'minecraft:shulker',
        'minecraft:silverfish',
        'minecraft:skeleton',
        'minecraft:slime',
        'minecraft:stray',
        'minecraft:vex',
        'minecraft:wither_skeleton',
        'minecraft:zoglin',
        'minecraft:zombie',
        'minecraft:zombie_villager',

        // Tensura (monstros comuns)
        'tensura:barghest',
        'tensura:basilisk',
        'tensura:black_spider',
        'tensura:blade_tiger',
        'tensura:direwolf',
        'tensura:evil_centipede',
        'tensura:giant_ant',
        'tensura:giant_bat',
        'tensura:horned_bear',
        'tensura:hound_dog',
        'tensura:knight_spider',
        'tensura:leech_lizard',
        'tensura:megalodon',
        'tensura:phantaspore',
        'tensura:slime',
        'tensura:metal_slime',
        'tensura:sissie',
        'tensura:spear_toro',
        'tensura:tempest_serpent',
        'tensura:falmuth_knight',

        // Ice and Fire (via tensura_iaf)
        'iceandfire:cockatrice',
        'iceandfire:deathworm',
        'iceandfire:dread_beast',
        'iceandfire:dread_ghoul',
        'iceandfire:dread_knight',
        'iceandfire:dread_horse',
        'iceandfire:dread_scuttler',
        'iceandfire:dread_thrall',
        'iceandfire:ghost',
        'iceandfire:siren',
        'iceandfire:stymphalian_bird',
        'iceandfire:troll',

        // Iron's Spells (via tensura_iron_spells)
        'irons_spellbooks:necromancer',
        'irons_spellbooks:cultist'
    ])
})
