import '@radix-ui/themes/styles.css'
import './extensions/annotator/painter/index.scss';

export { PdfAnnotator } from './features/annotator';
export type {
  PdfAnnotatorProps,
  PdfAnnotatorOptions,
  AnnotationPermissionAction,
  AnnotationPermissionMode,
  AnnotationPermissionRequest,
  AnnotationPermissions,
} from './extensions/annotator/types/annotator';
export { PdfViewer } from './features/viewer';
export type { PdfViewerProps } from './features/viewer';
export type { IAnnotationStore, IAnnotationComment } from './extensions/annotator/const/definitions';
export type {User, PdfBaseProps} from './types';
