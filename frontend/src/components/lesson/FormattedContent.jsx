import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import MediaGallery from './MediaGallery';

function FormattedContent({ content, media, onSectionChange }) {
    useEffect(() => {
        // Initialize Prism for syntax highlighting
        if (typeof window !== 'undefined') {
            Prism.highlightAll();
        }

        // Set up intersection observer to detect active section
        if (onSectionChange) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && entry.target.id) {
                            onSectionChange(entry.target.id);
                        }
                    });
                },
                { threshold: 0.2, rootMargin: '-100px 0px -300px 0px' }
            );

            // Observe all section headers
            document.querySelectorAll('[id]').forEach(section => {
                observer.observe(section);
            });

            return () => {
                document.querySelectorAll('[id]').forEach(section => {
                    observer.unobserve(section);
                });
            };
        }
    }, [content, onSectionChange]);

    if (!content) return null;

    // Check if content contains diagram or illustration references
    const hasDiagramReference = content.includes('diagram:') ||
        content.includes('Generate an educational illustration');

    // Find diagram media
    const diagramMedia = media?.filter(item =>
        item.media_type === 'diagram' ||
        item.media_type === 'image'
    );

    // Process content to handle emojis, headers, and other formatting
    const processedContent = content
        // Replace emoji indicators with actual emojis and add proper styling with section IDs
        .replace(/📚/g, '<div id="introduction" class="mb-8"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📚</span>Introduction</h3>')
        .replace(/🎯/g, '<div id="core-concepts" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎯</span>Core Concepts</h3>')
        .replace(/📍 ([^:\n]+):/g, (match, title) => {
            const id = title.toLowerCase().replace(/\s+/g, '-');
            return `<div id="${id}" class="mb-6"><h4 class="font-bold text-lg mb-3 text-slate-800 flex items-center"><span class="text-xl mr-2 opacity-80">📍</span>${title}</h4>`;
        })
        .replace(/🌟/g, '<div class="bg-white p-5 rounded-lg my-6 border border-slate-200 shadow-sm"><div class="flex items-start"><span class="text-xl mr-3 text-amber-500 mt-0.5">✨</span><div class="flex-1"><h4 class="font-bold text-lg mb-2 text-slate-800">Real-World Example</h4><div class="text-slate-700">')
        .replace(/💡/g, '<div class="bg-amber-50 p-5 rounded-lg my-6 border border-amber-100"><div class="flex items-start"><span class="text-xl mr-3 text-amber-500 mt-0.5">💡</span><div class="flex-1"><h4 class="font-bold text-lg mb-2 text-slate-800">Fun Fact</h4><div class="text-slate-700">')
        .replace(/🖼️/g, '<div id="visual-aids" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🖼️</span>Visual Aids</h3>')
        .replace(/🎮/g, '<div id="interactive-activities" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎮</span>Interactive Activities</h3>')
        .replace(/🔸 ([^:\n]+):/g, (match, title) => {
            const id = title.toLowerCase().replace(/\s+/g, '-');
            return `<div id="${id}" class="mb-6"><h4 class="font-bold text-lg mb-3 text-slate-800 flex items-center"><span class="text-amber-500 mr-2">●</span>${title}</h4>`;
        })
        .replace(/📝/g, '<div id="summary" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📝</span>Summary</h3>')

        // Close the divs for elements that need closing
        .replace(/:\n/g, '\n</div>')

        // Add closing divs for special elements
        .replace(/💡[\s\S]*?(?=<div|$)/g, match => `${match}</div></div></div>`)
        .replace(/🌟[\s\S]*?(?=<div|$)/g, match => `${match}</div></div></div>`)

        // Format headers and sections that might not have emojis
        .replace(/Introduction:/g, '<div id="introduction" class="mb-8"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📚</span>Introduction</h3>')
        .replace(/Core Concepts:/g, '<div id="core-concepts" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎯</span>Core Concepts</h3>')
        .replace(/Visual Aids:/g, '<div id="visual-aids" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🖼️</span>Visual Aids</h3>')
        .replace(/Interactive Activities:/g, '<div id="interactive-activities" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🎮</span>Interactive Activities</h3>')
        .replace(/Summary:/g, '<div id="summary" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">📝</span>Summary</h3>')
        .replace(/Extra Challenge:/g, '<div id="extra-challenge" class="mb-8 mt-10"><h3 class="font-bold text-xl mb-4 text-slate-800 flex items-center"><span class="text-2xl mr-3 opacity-80">🏆</span>Extra Challenge</h3>')

        // Format subsections
        .replace(/Materials needed:/g, '<h5 class="font-bold text-base mb-2 text-slate-700">Materials needed:</h5>')
        .replace(/What you'll learn:/g, '<h5 class="font-bold text-base mb-2 text-slate-700">What you\'ll learn:</h5>')

        // Format lists with better styling
        .replace(/- /g, '<li class="mb-2 text-slate-700 flex items-start"><span class="inline-block w-2 h-2 rounded-full bg-slate-400 mr-2 mt-2"></span><span>')
        .replace(/\n(?=<li)/g, '</span></li>\n')
        .replace(/<li(.*?)<\/li>/g, match => {
            if (!match.includes('</span></li>')) {
                return match.replace(/<\/li>/, '</span></li>');
            }
            return match;
        })

        // Add paragraph spacing
        .replace(/\n\n/g, '</p><p class="mb-4 text-slate-700 leading-relaxed">')

        // Wrap code blocks with language detection for syntax highlighting
        .replace(/```([a-z]*)\n([^`]+)```/g, (match, lang, code) => {
            const language = lang || 'javascript';
            return `<pre class="language-${language} bg-slate-800 text-slate-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="language-${language}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        })

        // Format inline code
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')

        // Add special styling for key terms
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em class="text-slate-800 italic">$1</em>')

        // Remove diagram references since we'll display them separately
        .replace(/• diagram:.*?Caption:.*?\n/gs, '')
        .replace(/• Generate an educational illustration.*?\n/g, '');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg max-w-none text-slate-700"
        >
            <p className="mb-4 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedContent }} />

            {/* Display diagrams in the Visual Aids section if they exist */}
            {hasDiagramReference && diagramMedia && diagramMedia.length > 0 && (
                <div className="mt-6">
                    <MediaGallery media={diagramMedia} />
                </div>
            )}
        </motion.div>
    );
}

export default FormattedContent; 