import { Game } from '@/lib/game'
import { BaseCharacter } from '@/lib/entities/character'

export class RemoteCharacter extends BaseCharacter {
    constructor(game: Game, initialPosition: 'left' | 'right') {
        super(game, initialPosition)
    }
}
