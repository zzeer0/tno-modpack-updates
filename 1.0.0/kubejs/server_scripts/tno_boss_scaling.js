// Neo Otherworld - Boss scaling: bosses from other mods brought to Tensura boss strength
//
// Every boss gets a tier measured against the Tensura bosses:
//   A  3000 HP / 80 ATK / 40 armor   (Charybdis, Gazel Dwargo, Hinata)
//   B   700 HP / 60 ATK / 20 armor   (Orc Disaster, Elemental Colossus)
//   C   400 HP / 40 ATK / 10 armor   (Ifrit, Sylphide, Undine, War Gnome)
//
// Health and armor are raised to the tier on spawn, never lowered. Damage is multiplied by
// tier ATK / the boss's native hit, and the multiplier follows every attack the boss owns:
// melee, projectiles (through their owner), parts and summons, attack entities of its own mod
// near it, and unattributed breath/area damage while it is targeting the victim.
// Tensura magic/ability damage is left out on purpose (that side scales with EP).
//
// This is the only place bosses are buffed. It replaces the Bosses'Rise x3 script, Mowzie's
// attack_multiplier and the Ice and Fire dragon x2 (both configs are back to native).
// tensuramagicfilter still sets HP/ATK for some Alex's/Ars/Mowzie's bosses on their first
// tick; this runs afterwards, native hits below are measured against what it sets, and
// Mowzie's ATK is put back to native because their abilities scale from the mod's own values.
//
// Stats are transient attribute modifiers re-applied every time a boss loads, so removing
// this script returns every boss to its mod's values.

const $Attributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const $AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier')
const $Operation = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation')
const $ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity')
const $TamableAnimal = Java.loadClass('net.minecraft.world.entity.TamableAnimal')

// Logs every scaled hit (boss, victim, damage before/after) to tune native hits in-game.
const DEBUG = false

const TIERS = {
    A: { health: 3000, attack: 80, armor: 40 },
    B: { health: 700, attack: 60, armor: 20 },
    C: { health: 400, attack: 40, armor: 10 }
}

// id -> [tier, native hit, options]
// native hit: the boss's main attack before this script, its ATTACK_DAMAGE or the hardcoded
// value when the mod ignores it. "(est.)" marks values not read from code.
// options: split       the fight is several entities sharing the tier's health
//          nativeHealth health grows with age, so it scales as a ratio of this adult value
//          nativeAttack ATTACK_DAMAGE is reset to this (undoes tensuramagicfilter)
const BOSSES = {
    // L_Ender's Cataclysm
    'cataclysm:ignis': ['A', 14],
    'cataclysm:netherite_monstrosity': ['A', 25],
    'cataclysm:ender_guardian': ['A', 16],
    'cataclysm:the_harbinger': ['A', 9],
    'cataclysm:the_leviathan': ['A', 15],
    'cataclysm:ancient_remnant': ['A', 25],
    'cataclysm:maledictus': ['A', 13],
    'cataclysm:scylla': ['A', 18],

    // Bosses'Rise (Block Factory)
    'block_factorys_bosses:kraken': ['A', 35],
    'block_factorys_bosses:infernal_dragon': ['A', 15],
    'block_factorys_bosses:underworld_knight': ['A', 30],
    'block_factorys_bosses:sandworm': ['A', 28],
    'block_factorys_bosses:yeti': ['A', 32],

    // Ice and Fire (dragon values are the config's native 17 attack / 700 adult health)
    'iceandfire:fire_dragon': ['A', 17, { nativeHealth: 700 }],
    'iceandfire:ice_dragon': ['A', 17, { nativeHealth: 700 }],
    'iceandfire:lightning_dragon': ['A', 17, { nativeHealth: 700 }],
    'iceandfire:dread_lich': ['B', 6], // (est.)
    'iceandfire:gorgon': ['B', 6], // (est.)
    'iceandfire:hydra': ['B', 6], // (est.)

    // Iron's Spells 'n Spellbooks
    'irons_spellbooks:fire_boss': ['A', 10],
    'irons_spellbooks:dead_king': ['B', 10],

    // Alex's Caves / Alex's Mobs / Ars Nouveau (native hit = tensuramagicfilter ATK)
    'alexscaves:tremorzilla': ['A', 85],
    'alexscaves:luxtructosaurus': ['A', 12],
    'alexsmobs:void_worm': ['A', 65],
    'ars_nouveau:wilden_boss': ['A', 80],
    'alexscaves:atlatitan': ['B', 58],
    'alexscaves:hullbreaker': ['B', 60],
    'alexscaves:forsaken': ['B', 50],
    'alexsmobs:warped_mosco': ['B', 40],
    'alexsmobs:laviathan': ['B', 28],
    'alexscaves:tremorsaurus': ['C', 45],
    'alexscaves:gum_worm': ['C', 38],
    'alexscaves:licowitch': ['C', 24],
    'alexsmobs:farseer': ['C', 28],
    'alexsmobs:murmur': ['C', 26],
    'alexsmobs:sunbird': ['C', 18],
    'alexsmobs:cosmaw': ['C', 16],
    'alexsmobs:skreecher': ['C', 14],
    'alexsmobs:underminer': ['C', 15],

    // Mowzie's Mobs (Umvuthi: Sunstrike 2, Solar Beam 1.5 per tick)
    'mowziesmobs:frostmaw': ['B', 10, { nativeAttack: 10 }],
    'mowziesmobs:umvuthi': ['B', 2, { nativeAttack: 2 }],
    'mowziesmobs:sculptor': ['B', 10, { nativeAttack: 10 }],
    'mowziesmobs:ferrous_wroughtnaut': ['B', 30],

    // Twilight Forest (damage is hardcoded: Hydra flame 19 / bite 48, Ur-Ghast fireball 16)
    'twilightforest:naga': ['C', 4],
    'twilightforest:lich': ['C', 5], // (est.)
    'twilightforest:minoshroom': ['C', 7], // (est.)
    'twilightforest:hydra': ['B', 19],
    'twilightforest:knight_phantom': ['B', 7, { split: 6 }], // (est.)
    'twilightforest:ur_ghast': ['B', 16],
    'twilightforest:alpha_yeti': ['B', 5],
    'twilightforest:snow_queen': ['B', 7],

    // Bosses of Mass Destruction
    'bosses_of_mass_destruction:lich': ['B', 9],
    'bosses_of_mass_destruction:obsidilith': ['B', 16],
    'bosses_of_mass_destruction:gauntlet': ['B', 16],
    'bosses_of_mass_destruction:void_blossom': ['B', 12],

    // Eternal Starlight
    'eternal_starlight:the_gatekeeper': ['B', 5],
    'eternal_starlight:starlight_golem': ['B', 4],
    'eternal_starlight:lunar_monstrosity': ['B', 15],
    'eternal_starlight:solar_creeper': ['B', 12],

    // Chronodawn
    'chronodawn:time_tyrant': ['A', 18],
    'chronodawn:time_guardian': ['C', 10],
    'chronodawn:chronos_warden': ['C', 9],
    'chronodawn:clockwork_colossus': ['C', 12],
    'chronodawn:entropy_keeper': ['C', 10],
    'chronodawn:temporal_phantom': ['C', 8],

    // Others
    'mysticism:memoires': ['A', 25],
    'rpg_style_more_bosses:the_exoframe': ['A', 25],
    'minecraft:ender_dragon': ['A', 10],
    'minecraft:wither': ['B', 8]
}

// Separate entities that are part of a boss: health is this share of the boss's tier health,
// and their hits use the boss's multiplier.
const PARTS = {
    'block_factorys_bosses:kraken_tentacle': ['block_factorys_bosses:kraken', 50 / 950],
    'twilightforest:hydra_head': ['twilightforest:hydra', 0]
}

// Living summons that hit with their boss's multiplier (kept from the Bosses'Rise x3 script).
const SUMMONS = {
    'block_factorys_bosses:ghost_tentacle': true,
    'block_factorys_bosses:pirate_captain': true,
    'block_factorys_bosses:pirate_rook': true,
    'block_factorys_bosses:crossbow_pirate': true,
    'block_factorys_bosses:soul_skeleton': true,
    'block_factorys_bosses:soul_knight_wither_skeleton': true,
    'block_factorys_bosses:dragon_guard_sword': true,
    'block_factorys_bosses:flaming_skeleton_guard_sword': true,
    'block_factorys_bosses:flaming_skeleton_guard_fireball': true,
    'block_factorys_bosses:frozen_skeleton': true,
    'block_factorys_bosses:cage_skelly': true,
    'block_factorys_bosses:big_cage_skelly': true
}

// Player-side weapons living in a boss mod's namespace.
const PLAYER_WEAPONS = {
    'block_factorys_bosses:cannonball': true,
    'block_factorys_bosses:kraken_cannon': true,
    'block_factorys_bosses:kraken_trident': true,
    'block_factorys_bosses:anchor': true
}

// The Kraken's tentacles are separate entities nothing marks as allies.
const KRAKEN_SIDE = {
    'block_factorys_bosses:kraken': true,
    'block_factorys_bosses:kraken_tentacle': true,
    'block_factorys_bosses:cinematic_kraken': true
}

// Damage without any attacker entity that counts as a boss's breath/area/beam attack.
const AREA_DAMAGE_TYPES = {
    magic: true, indirectMagic: true, freeze: true, inFire: true, onFire: true, player: true,
    mob: true, generic: true, explosion: true, 'explosion.player': true, lightningBolt: true,
    dragonBreath: true, wither: true, sonic_boom: true
}
const AREA_RADIUS = 24.0
const ATTACK_ENTITY_RADIUS = 32.0

const HEALTH_MODIFIER = $ResourceLocation.fromNamespaceAndPath('tno', 'boss_scaling_health')
const ARMOR_MODIFIER = $ResourceLocation.fromNamespaceAndPath('tno', 'boss_scaling_armor')
const FILLED_TAG = 'tno_boss_scaling_filled'

function typeOf(entity) {
    return entity == null ? '' : String(entity.type)
}

function namespaceOf(type) {
    const i = type.indexOf(':')
    return i < 0 ? '' : type.substring(0, i)
}

const MULTIPLIERS = {}
const NAMESPACES = {}
Object.keys(BOSSES).forEach(id => {
    const def = BOSSES[id]
    MULTIPLIERS[id] = Math.max(1.0, TIERS[def[0]].attack / def[1])
    // Vanilla attack entities (lightning, falling blocks...) are too generic to attribute.
    if (namespaceOf(id) != 'minecraft') NAMESPACES[namespaceOf(id)] = true
})

// Live bosses, for attacks that carry no attacker. Keyed by UUID.
const active = {}

function track(entity) {
    // KubeJS renames some vanilla methods for scripts: getStringUUID is getStringUuid here.
    active[String(entity.getStringUuid())] = entity
}

function isOwned(entity) {
    return entity instanceof $TamableAnimal && entity.isTame()
}

function setModifier(instance, id, amount, operation) {
    if (instance == null) return
    if (amount <= 0) {
        instance.removeModifier(id)
        return
    }
    instance.addOrUpdateTransientModifier(new $AttributeModifier(id, amount, operation))
}

function applyStats(entity, tier, options, healthShare) {
    if (!entity.isAlive() || isOwned(entity)) return

    if (options.nativeAttack != null) {
        const attack = entity.getAttribute($Attributes.ATTACK_DAMAGE)
        if (attack != null) attack.setBaseValue(options.nativeAttack)
    }

    const health = entity.getAttribute($Attributes.MAX_HEALTH)
    if (health != null) {
        if (options.nativeHealth != null) {
            setModifier(health, HEALTH_MODIFIER, tier.health / options.nativeHealth - 1, $Operation.ADD_MULTIPLIED_BASE)
        } else {
            const target = tier.health * healthShare
            setModifier(health, HEALTH_MODIFIER, target - health.getBaseValue(), $Operation.ADD_VALUE)
        }
    }
    const armor = entity.getAttribute($Attributes.ARMOR)
    if (armor != null) setModifier(armor, ARMOR_MODIFIER, tier.armor - armor.getBaseValue(), $Operation.ADD_VALUE)

    // Fill health only the first time, so reloading a chunk never heals a boss mid-fight.
    const data = entity.getPersistentData()
    if (!data.getBoolean(FILLED_TAG)) {
        entity.setHealth(entity.getMaxHealth())
        data.putBoolean(FILLED_TAG, true)
    }
}

function onSpawn(id, tier, options, healthShare, isBoss) {
    try {
        EntityEvents.spawned(id, event => {
            const entity = event.entity
            const server = entity.server
            if (server == null) return
            if (isBoss) track(entity)
            // Some mods set their stats a few ticks after joining (tensuramagicfilter on the
            // first tick, the Infernal Dragon from its spawner), so apply twice.
            server.scheduleInTicks(5, () => applyStats(entity, tier, options, healthShare))
            server.scheduleInTicks(40, () => applyStats(entity, tier, options, healthShare))
        })
    } catch (e) {
        console.warn(`[tno_boss_scaling] could not hook ${id}: ${e}`)
    }
}

Object.keys(BOSSES).forEach(id => {
    const def = BOSSES[id]
    const options = def[2] || {}
    onSpawn(id, TIERS[def[0]], options, 1 / (options.split || 1), true)
})
Object.keys(PARTS).forEach(id => {
    const part = PARTS[id]
    if (part[1] > 0) onSpawn(id, TIERS[BOSSES[part[0]][0]], {}, part[1], false)
})

function isTensuraAbility(source) {
    try {
        if (source.tensura$getAbilityInstance() != null
            || source.tensura$getMagicType() != null
            || source.tensura$getSkillType() != null) return true
    } catch (e) {}
    try {
        const key = source.typeHolder().unwrapKey()
        if (!key.isPresent()) return false
        const namespace = String(key.get().location().getNamespace())
        return namespace.startsWith('tensura') || namespace.startsWith('manascore')
    } catch (e) {
        return false
    }
}

function asBoss(entity) {
    if (entity == null || isOwned(entity)) return null
    const type = typeOf(entity)
    if (BOSSES[type]) return type
    if (PARTS[type]) return PARTS[type][0]
    return null
}

function ownerOf(entity) {
    try {
        const owner = entity.getOwner()
        return owner == null ? null : owner
    } catch (e) {
        return null
    }
}

function dimensionOf(entity) {
    // KubeJS exposes level.dimension as a property (the dimension id), not the vanilla method.
    return String(entity.level.dimension)
}

// Nearest live boss (optionally of one mod, optionally targeting the victim).
function nearestBoss(victim, namespace, radius, mustTarget) {
    let best = null
    let bestDistance = radius
    const dimension = dimensionOf(victim)
    Object.keys(active).forEach(key => {
        const boss = active[key]
        if (!boss.isAlive() || boss.isRemoved()) {
            delete active[key]
            return
        }
        if (dimensionOf(boss) != dimension) return
        const type = typeOf(boss)
        if (namespace != null && namespaceOf(type) != namespace) return
        if (mustTarget && !victim.equals(boss.getTarget())) return
        const distance = boss.distanceToEntity(victim)
        if (distance <= bestDistance) {
            best = type
            bestDistance = distance
        }
    })
    return best
}

// Which boss this damage belongs to, or null.
function bossOf(victim, source, attacker, direct) {
    const boss = asBoss(attacker) || asBoss(direct)
    if (boss != null) return boss

    const candidates = [direct, attacker]
    for (let i = 0; i < candidates.length; i++) {
        const entity = candidates[i]
        if (entity == null) continue
        const type = typeOf(entity)
        if (PLAYER_WEAPONS[type]) return null
        // An owned projectile or summon belongs to whoever owns it, and to nobody else.
        const owner = ownerOf(entity)
        if (owner != null) return asBoss(owner)
        if (SUMMONS[type]) return nearestBoss(victim, namespaceOf(type), ATTACK_ENTITY_RADIUS, false)
        if (!(entity instanceof $LivingEntity) && NAMESPACES[namespaceOf(type)]) {
            return nearestBoss(victim, namespaceOf(type), ATTACK_ENTITY_RADIUS, false)
        }
    }

    if (attacker == null && direct == null && AREA_DAMAGE_TYPES[String(source.getType())]) {
        return nearestBoss(victim, null, AREA_RADIUS, true)
    }
    return null
}

EntityEvents.beforeHurt(event => {
    const victim = event.entity
    const victimType = typeOf(victim)
    const source = event.source
    // KubeJS names: getEntity -> getActual, getDirectEntity -> getImmediate, getMsgId -> getType.
    const attacker = source.getActual()
    const direct = source.getImmediate()
    const attackerType = typeOf(attacker)
    const directType = typeOf(direct)

    if (KRAKEN_SIDE[victimType] && (KRAKEN_SIDE[attackerType] || KRAKEN_SIDE[directType])) {
        event.setDamage(0)
        return
    }

    // Bosses re-enter tracking after a script reload as soon as they fight.
    if (BOSSES[victimType]) {
        track(victim)
        return
    }
    if (BOSSES[attackerType]) track(attacker)

    if (isTensuraAbility(source)) return

    const boss = bossOf(victim, source, attacker, direct)
    if (boss == null) return
    // A boss hitting its own mod's mobs (minions, parts) is left alone.
    if (namespaceOf(victimType) == namespaceOf(boss) && !victim.isPlayer()) return

    const scaled = event.damage * MULTIPLIERS[boss]
    if (DEBUG) console.info(`[tno_boss_scaling] ${boss} -> ${victimType} ${String(source.getType())}: ${event.damage} x${MULTIPLIERS[boss].toFixed(2)} = ${scaled.toFixed(1)}`)
    event.setDamage(scaled)
})
