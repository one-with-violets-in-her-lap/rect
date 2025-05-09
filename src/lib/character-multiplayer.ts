import { EntityMovement } from '@/lib/entities'

export type MultiPlayerPayloadPacket = {
    actionType: 'update-movement-state'
    newMovementState: EntityMovement
}
