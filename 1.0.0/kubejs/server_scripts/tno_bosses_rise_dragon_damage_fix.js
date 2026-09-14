// Neo Otherworld - Bosses'Rise Infernal Dragon damage fix
// InfernalDragonEntity.finalizeSpawn applies DRAGON_HEALTH and DRAGON_ARMOR but never
// DRAGON_ATK (the other four bosses apply all three), so "Dragon Damage" in
// config/block_factorys_bosses-server.toml had no effect: the dragon kept its default
// 14 ATTACK_DAMAGE.
// Claw (x0.834), bite (x0.667) and tail swipe (x1.0) go through attackEntity, which reads
// ATTACK_DAMAGE, so setting the attribute from the config fixes those attacks.
// Fire breath and fireballs are hardcoded and are not affected.

// KubeJS shares one scope across server scripts: tno_boss_scaling.js already declares $Attributes.
const $DragonFixAttributes = Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes')
const DRAGON_ID = 'block_factorys_bosses:infernal_dragon'
const FALLBACK_ATK = 15.0

let dragonAtkConfig = null
try {
    dragonAtkConfig = Java.loadClass('net.unusual.block_factorys_bosses.configuration.ServerConfiguration').DRAGON_ATK
} catch (e) {
    console.warn(`[tno_dragon_fix] Could not load Bosses'Rise config, falling back to ${FALLBACK_ATK}: ${e}`)
}

function configuredDragonAtk() {
    if (dragonAtkConfig != null) {
        try {
            return Number(dragonAtkConfig.get())
        } catch (e) {
            console.warn(`[tno_dragon_fix] Could not read DRAGON_ATK, falling back to ${FALLBACK_ATK}: ${e}`)
        }
    }
    return FALLBACK_ATK
}

EntityEvents.spawned(DRAGON_ID, event => {
    const attribute = event.entity.getAttribute($DragonFixAttributes.ATTACK_DAMAGE)
    if (attribute == null) return

    const atk = configuredDragonAtk()
    if (attribute.getBaseValue() != atk) {
        attribute.setBaseValue(atk)
    }
})
