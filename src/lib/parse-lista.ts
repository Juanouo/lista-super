import fs from 'fs';
import path from 'path';
import { ParsedList, Section, Subsection, ListItem } from './types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export function parseLista(): ParsedList {
  const filePath = path.join(process.cwd(), 'data', 'lista-super.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentSubsection: Subsection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      const title = trimmed.slice(2).trim();
      currentSection = {
        id: slugify(title),
        title,
        items: [],
        subsections: [],
      };
      currentSubsection = null;
      sections.push(currentSection);
    } else if (trimmed.startsWith('## ')) {
      if (!currentSection) continue;
      const title = trimmed.slice(3).trim();
      currentSubsection = {
        id: `${currentSection.id}__${slugify(title)}`,
        title,
        items: [],
      };
      currentSection.subsections.push(currentSubsection);
    } else if (trimmed.startsWith('- ')) {
      const name = trimmed.slice(2).trim();
      const item: ListItem = {
        id: `${currentSection?.id ?? 'root'}__${currentSubsection?.id ?? 'direct'}__${slugify(name)}`,
        name,
      };
      if (currentSubsection) {
        currentSubsection.items.push(item);
      } else if (currentSection) {
        currentSection.items.push(item);
      }
    }
  }

  return sections;
}

export function sectionsToMarkdown(sections: Section[]): string {
  const lines: string[] = [];

  for (const section of sections) {
    lines.push(`# ${section.title}`);
    lines.push('');

    for (const item of section.items) {
      lines.push(`- ${item.name}`);
    }
    if (section.items.length > 0) lines.push('');

    for (const sub of section.subsections) {
      lines.push(`## ${sub.title}`);
      for (const item of sub.items) {
        lines.push(`- ${item.name}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
