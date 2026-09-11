// Neo Otherworld - Carry On: mobs que nao podem ser carregados
// O Carry On ja nao carrega mobs hostis nem nada maior que 1.5x2.5 blocos, mas bosses humanoides
// (Hinata, Shizu...) cabem nesse tamanho e nem sempre contam como hostis.
// carryon:entity_blacklist e uma tag que o proprio Carry On sempre consulta.

ServerEvents.tags('entity_type', event => {
    event.add('carryon:entity_blacklist', [
        // bosses de todos os mods (mesmas tags que bloqueiam o Chosen One)
        '#tensura:boss_for_hero',
        '#c:bosses',
        '#tensura:clones',

        // partes de mobs grandes: carregar uma parte quebra o mob
        'tensura:evil_centipede_body',
        'tensura:tempest_serpent_body',

        // personagens da historia do Tensura
        'tensura:folgen',
        'tensura:gazel_dwargo',
        'tensura:hinata_sakaguchi',
        'tensura:kirara_mizutani',
        'tensura:kyoya_tachibana',
        'tensura:mai_furuki',
        'tensura:mark_lauren',
        'tensura:shinji_tanimura',
        'tensura:shin_ryusei',
        'tensura:shizu',
        'tensura:shogo_taguchi'
    ])
})
