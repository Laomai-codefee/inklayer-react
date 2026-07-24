export const NAVIGATION_PAGE_MARKERS_CHANGED_EVENT = 'inklayer:navigation-page-markers-changed'

export interface NavigationPageMarkersChangedEvent {
    source: string
    markers: ReadonlyMap<number, number>
}
