// Neo Otherworld - Fixed Initial Soul Energy
// Define 500.000 SOMENTE como Soul Energy inicial.
// Depois disso, Mysticism continua controlando normalmente todos os aumentos.

const INITIAL_SOUL_ENERGY = 500000
const INIT_TAG = 'neo_fixed_initial_soul_energy_v1'

PlayerEvents.loggedIn(event => {
    const player = event.player

    // Já inicializado: nunca sobrescrever bônus/aumentos posteriores do Mysticism.
    if (player.persistentData.getBoolean(INIT_TAG)) {
        return
    }

    // Aguarda Mysticism carregar os dados do jogador.
    event.server.scheduleInTicks(20, () => {
        const name = player.getGameProfile().getName()

        event.server.runCommandSilent(
            `mysticism edit stat ${name} soulEnergy max set ${INITIAL_SOUL_ENERGY}`
        )

        event.server.runCommandSilent(
            `mysticism edit stat ${name} soulEnergy current set ${INITIAL_SOUL_ENERGY}`
        )

        // A partir daqui, este script nunca mais altera a Soul Energy desse jogador.
        player.persistentData.putBoolean(INIT_TAG, true)

        player.tell('Soul Energy inicial definida em 500.000.')
    })
})
