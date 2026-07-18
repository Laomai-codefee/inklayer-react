import { storeToAnnotation } from '@/core/adapters/store.mapper'
import type { User } from '@/types'
import type { IAnnotationComment, IAnnotationStore } from '../const/definitions'
import type {
    AnnotationPermissionAction,
    AnnotationPermissions
} from '../types/annotator'

export interface AnnotationPermissionControllerOptions {
    getCurrentUser: () => User | null
    getPermissions: () => AnnotationPermissions | undefined
}

function hasAuthenticatedUser(user: User | null): user is User {
    return Boolean(user?.id && user.id !== 'null')
}

function hasSameAuthor(currentUser: User | null, author?: User): boolean {
    return hasAuthenticatedUser(currentUser) && Boolean(author?.id) && currentUser.id === author?.id
}

export class AnnotationPermissionController {
    private readonly getCurrentUser: () => User | null
    private readonly getPermissions: () => AnnotationPermissions | undefined
    private readonly reportedResolvers = new WeakSet<NonNullable<AnnotationPermissions['can']>>()

    constructor({ getCurrentUser, getPermissions }: AnnotationPermissionControllerOptions) {
        this.getCurrentUser = getCurrentUser
        this.getPermissions = getPermissions
    }

    public can(
        action: AnnotationPermissionAction,
        annotation?: IAnnotationStore,
        comment?: IAnnotationComment
    ): boolean {
        const currentUser = this.getCurrentUser()
        const permissions = this.getPermissions()
        const mode = permissions?.mode ?? 'unrestricted'
        const defaultAllowed = mode === 'unrestricted'
            ? true
            : this.ownerOnlyDecision(action, currentUser, annotation, comment)

        if (!permissions?.can) return defaultAllowed

        try {
            const override = permissions.can({
                action,
                currentUser,
                annotation: annotation ? storeToAnnotation(annotation) : undefined,
                comment,
                defaultAllowed
            })
            return override ?? defaultAllowed
        } catch (error) {
            if (!this.reportedResolvers.has(permissions.can)) {
                this.reportedResolvers.add(permissions.can)
                console.error('InkLayer annotation permission resolver failed.', error)
            }
            return false
        }
    }

    private ownerOnlyDecision(
        action: AnnotationPermissionAction,
        currentUser: User | null,
        annotation?: IAnnotationStore,
        comment?: IAnnotationComment
    ): boolean {
        switch (action) {
            case 'annotation.create':
            case 'annotation.comment':
                return hasAuthenticatedUser(currentUser)
            case 'annotation.transform':
            case 'annotation.edit':
            case 'annotation.delete':
            case 'annotation.change-status':
                return hasSameAuthor(currentUser, annotation?.user)
            case 'comment.edit':
            case 'comment.delete':
                return hasSameAuthor(currentUser, comment?.user)
        }
    }
}
