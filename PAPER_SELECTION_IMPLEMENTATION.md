# Paper Selection Implementation for Subject Offerings

## Overview
This implementation adds the ability to select specific papers when creating or editing subject offerings. This is particularly useful for subjects like ICT that have multiple papers offered in different classes.

## Changes Made

### 1. Database Schema Changes

#### New Column Added
- **Table**: `subject_offerings`
- **Column**: `paper_id` (UUID, nullable)
- **Foreign Key**: References `subject_papers(paper_id)` with `ON DELETE SET NULL`
- **Index**: Created for better query performance

#### SQL Migration
```sql
ALTER TABLE subject_offerings 
ADD COLUMN IF NOT EXISTS paper_id UUID REFERENCES subject_papers(paper_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subject_offerings_paper_id ON subject_offerings(paper_id);
```

### 2. Frontend Changes

#### SubjectOfferingForm Component
- **Added**: Paper selection dropdown
- **Added**: Dynamic paper fetching based on selected subject
- **Added**: Paper state management (`paperId`, `papers`)
- **Updated**: Form submission to include `paper_id`

#### Key Features
- **Dynamic Loading**: Papers are fetched automatically when a subject is selected
- **Optional Selection**: Users can choose "No specific paper" if not needed
- **Clear Display**: Papers show as "Paper Code - Paper Name" format
- **Empty State**: Shows helpful message when no papers are available
- **Multiple Paper Indicators**: Shows "+X options" when multiple papers are available
- **Visual Cues**: Blue indicators and checkmarks for better user experience

#### ManageOfferingsModal Component
- **Updated**: Query to include paper information
- **Added**: Paper column in the offerings table
- **Enhanced**: Display shows paper code and name when available

### 3. Database Types Updated
- **Added**: `paper_id` field to `subject_offerings` table types
- **Added**: Foreign key relationship to `subject_papers`
- **Updated**: Insert, Update, and Row type definitions

## Usage

### For Administrators
1. **Adding New Offering**: 
   - Select a subject (e.g., "ICT")
   - Choose program and level
   - Optionally select a specific paper from the dropdown
   - Fill in other details and save

2. **Editing Existing Offering**:
   - Open the offering for editing
   - Paper selection will show current paper (if any)
   - Can change or remove paper selection

3. **Viewing Offerings**:
   - Paper column shows selected paper or "No specific paper"
   - Format: "PAPER_CODE - Paper Name"

### For Subjects with Multiple Papers
- **ICT Example**: Can offer Paper 1, Paper 2, Paper 3 in different classes
- **Mathematics**: Can offer Core Mathematics, Additional Mathematics
- **Languages**: Can offer different language papers
- **Visual Indicators**: Subjects with multiple papers show "+X papers" in dropdown
- **Selection Guidance**: Clear indication when multiple options are available

## Benefits

1. **Flexibility**: Allows precise paper selection for each offering
2. **Clarity**: Clear distinction between different papers of the same subject
3. **Scalability**: Easy to add new papers to subjects
4. **User Experience**: Intuitive dropdown selection with clear labeling
5. **Multiple Paper Awareness**: Clear indicators when subjects have multiple paper options
6. **Selection Guidance**: Helps administrators choose the right paper for each class

## Technical Implementation

### State Management
```javascript
const [paperId, setPaperId] = useState(offeringItem?.paper_id || '');
const [papers, setPapers] = useState([]);
```

### Paper Fetching
```javascript
useEffect(() => {
  async function fetchPapers() {
    if (!subjectId) return;
    
    const { data, error } = await supabase
      .from('subject_papers')
      .select('paper_id, paper_code, paper_name')
      .eq('subject_id', subjectId)
      .order('paper_code');
    
    setPapers(data || []);
  }
  
  fetchPapers();
}, [subjectId]);
```

### Form Submission
```javascript
const dataToSave = {
  // ... other fields
  paper_id: paperId || null,
};
```

## Database Relationships

```
subject_offerings
├── subject_id → subjects(subject_id)
├── program_id → programs(program_id)
├── level_id → levels(level_id)
└── paper_id → subject_papers(paper_id) [NEW]
```

## Files Modified

1. **Database Schema**:
   - `add_paper_to_offerings.sql` (migration)
   - `apply_paper_changes.sql` (manual application)

2. **Frontend Components**:
   - `app/admin/subjects/page.jsx` (main implementation)

3. **Type Definitions**:
   - `database.types.ts` (updated types)

4. **Documentation**:
   - `PAPER_SELECTION_IMPLEMENTATION.md` (this file)

## Next Steps

1. **Apply Database Changes**: Run the SQL script in Supabase SQL editor
2. **Test Functionality**: Create test offerings with different papers
3. **Verify Display**: Check that paper information shows correctly in tables
4. **User Training**: Inform administrators about the new feature

## Notes

- Paper selection is **optional** - offerings can exist without specific papers
- Papers are **subject-specific** - only papers for the selected subject appear
- **Backward Compatible** - existing offerings without papers continue to work
- **Performance Optimized** - includes database index for paper_id queries
