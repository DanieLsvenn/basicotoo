"use client";

import { Editor } from "@tinymce/tinymce-react";

interface DynamicEditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export default function DynamicEditor({
  content,
  onContentChange,
}: DynamicEditorProps) {
  return (
    <Editor
      apiKey="amj66irc2lxmvlyaw14i6oz621ont4tx9lk8owitkkay1wbc"
      value={content}
      init={{
        height: 500,
        menubar: false,
        plugins: ["lists", "link", "table", "code"],
        toolbar:
          "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | code",
      }}
      onEditorChange={onContentChange}
    />
  );
}
