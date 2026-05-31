/**
 * Converts the Candidate Profile JSON object into a structured markdown text string
 * to be sent to the AI agents in place of a parsed PDF resume.
 */
export function formatProfileToText(profile) {
  if (!profile) return '';

  const {
    fullName = '',
    title = '',
    email = '',
    phone = '',
    location = '',
    github = '',
    linkedin = '',
    website = '',
    bio = '',
    skills = []
  } = profile;

  let text = `# ${fullName}\n`;
  if (title) text += `## ${title}\n`;
  
  const contact = [email, phone, location, github, linkedin, website].filter(Boolean);
  if (contact.length > 0) {
    text += `${contact.join(' | ')}\n\n`;
  }

  if (bio) {
    text += `### Professional Summary\n${bio}\n\n`;
  }

  if (skills && skills.length > 0) {
    text += `### Technical Skills\n${skills.join(', ')}\n\n`;
  }

  return text.trim();
}
