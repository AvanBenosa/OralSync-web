import FormatAlignCenterRoundedIcon from '@mui/icons-material/FormatAlignCenterRounded';
import FormatAlignLeftRoundedIcon from '@mui/icons-material/FormatAlignLeftRounded';
import FormatAlignRightRoundedIcon from '@mui/icons-material/FormatAlignRightRounded';
import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded';
import FormatClearRoundedIcon from '@mui/icons-material/FormatClearRounded';
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import FormatUnderlinedRoundedIcon from '@mui/icons-material/FormatUnderlinedRounded';
import { FunctionComponent, JSX, useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

import styles from '../../style.scss.module.scss';

type TemplateFormEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
};

type ToolbarAction = {
  id: string;
  label: string;
  icon: JSX.Element;
  isActive: () => boolean;
  onClick: () => void;
};

const EMPTY_EDITOR_HTML = '<p></p>';

const TemplateFormEditor: FunctionComponent<TemplateFormEditorProps> = (
  props: TemplateFormEditorProps
): JSX.Element => {
  const { value, onChange, onFocus, placeholder = 'Write your template content here...' } = props;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value?.trim() || EMPTY_EDITOR_HTML,
    editorProps: {
      attributes: {
        class: styles.templateRichEditorContent,
      },
    },
    onFocus: () => {
      onFocus?.();
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = value?.trim() || EMPTY_EDITOR_HTML;
    if (editor.getHTML() === nextContent) {
      return;
    }

    editor.commands.setContent(nextContent, {
      emitUpdate: false,
    });
  }, [editor, value]);

  const toolbarActions = useMemo<ToolbarAction[]>(
    () => [
      {
        id: 'bold',
        label: 'Bold',
        icon: <FormatBoldRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive('bold')),
        onClick: () => {
          editor?.chain().focus().toggleBold().run();
        },
      },
      {
        id: 'italic',
        label: 'Italic',
        icon: <FormatItalicRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive('italic')),
        onClick: () => {
          editor?.chain().focus().toggleItalic().run();
        },
      },
      {
        id: 'underline',
        label: 'Underline',
        icon: <FormatUnderlinedRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive('underline')),
        onClick: () => {
          editor?.chain().focus().toggleUnderline().run();
        },
      },
      {
        id: 'bulletList',
        label: 'Bulleted list',
        icon: <FormatListBulletedRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive('bulletList')),
        onClick: () => {
          editor?.chain().focus().toggleBulletList().run();
        },
      },
      {
        id: 'orderedList',
        label: 'Numbered list',
        icon: <FormatListNumberedRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive('orderedList')),
        onClick: () => {
          editor?.chain().focus().toggleOrderedList().run();
        },
      },
      {
        id: 'alignLeft',
        label: 'Align left',
        icon: <FormatAlignLeftRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive({ textAlign: 'left' })),
        onClick: () => {
          editor?.chain().focus().setTextAlign('left').run();
        },
      },
      {
        id: 'alignCenter',
        label: 'Align center',
        icon: <FormatAlignCenterRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive({ textAlign: 'center' })),
        onClick: () => {
          editor?.chain().focus().setTextAlign('center').run();
        },
      },
      {
        id: 'alignRight',
        label: 'Align right',
        icon: <FormatAlignRightRoundedIcon fontSize="small" />,
        isActive: () => Boolean(editor?.isActive({ textAlign: 'right' })),
        onClick: () => {
          editor?.chain().focus().setTextAlign('right').run();
        },
      },
      {
        id: 'clearFormatting',
        label: 'Clear formatting',
        icon: <FormatClearRoundedIcon fontSize="small" />,
        isActive: () => false,
        onClick: () => {
          editor?.chain().focus().unsetAllMarks().clearNodes().run();
        },
      },
    ],
    [editor]
  );

  return (
    <div className={styles.templateEditorField}>
      <label className={styles.templateEditorLabel}>Template Content</label>

      <div className={styles.templateEditorShell}>
        <div className={styles.templateEditorToolbar}>
          {toolbarActions.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.label}
              aria-label={action.label}
              className={`${styles.templateEditorToolbarButton} ${
                action.isActive() ? styles.templateEditorToolbarButtonActive : ''
              }`}
              onClick={action.onClick}
              disabled={!editor}
            >
              {action.icon}
            </button>
          ))}
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TemplateFormEditor;
