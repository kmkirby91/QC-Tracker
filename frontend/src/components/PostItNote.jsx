import React, { useState, useEffect, useRef } from 'react';

const PostItNote = () => {
  const [note, setNote] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Load saved note on component mount
  useEffect(() => {
    const savedNote = localStorage.getItem('qc-tracker-note');
    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  // Auto-save note whenever it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('qc-tracker-note', note);
    }, 500); // Debounce saving by 500ms

    return () => clearTimeout(timeoutId);
  }, [note]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [note]);

  const handleChange = (e) => {
    setNote(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Widget header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">📝 Quick Notes</h3>
        {note && (
          <div className="text-xs text-green-400 opacity-70">
            ✓ Auto-saved
          </div>
        )}
      </div>

      {/* Textarea for notes */}
      <textarea
        ref={textareaRef}
        value={note}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Jot down quick notes here...&#10;• Remember to check CT calibration&#10;• Schedule maintenance for MRI-2&#10;• Review yesterday's QC results"
        className={`
          w-full bg-gray-700 border border-gray-600 rounded-md p-3 outline-none resize-none
          text-gray-100 text-sm placeholder-gray-400
          min-h-[100px] leading-relaxed transition-colors duration-200
          ${isFocused ? 'border-blue-500 bg-gray-600' : 'hover:bg-gray-650 hover:border-gray-500'}
        `}
      />
    </div>
  );
};

export default PostItNote;