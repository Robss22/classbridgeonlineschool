# Multiple Papers Per Offering Implementation Guide

## Overview
This guide explains how to modify the system to allow **multiple papers per subject offering** instead of just one paper per offering.

## Current vs New Structure

### Current Structure (Single Paper)
```
subject_offerings
├── id
├── subject_id
├── program_id
├── level_id
├── paper_id (single paper reference)
└── other fields...
```

### New Structure (Multiple Papers)
```
subject_offerings
├── id
├── subject_id
├── program_id
├── level_id
└── other fields...

offering_papers (junction table)
├── id
├── offering_id (references subject_offerings)
├── paper_id (references subject_papers)
└── created_at
```

## Implementation Steps

### 1. Database Changes

Run the SQL script `multiple_papers_implementation.sql`:

```sql
-- Create junction table for multiple papers per offering
CREATE TABLE IF NOT EXISTS offering_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES subject_offerings(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES subject_papers(paper_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination
    UNIQUE(offering_id, paper_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offering_papers_offering_id ON offering_papers(offering_id);
CREATE INDEX IF NOT EXISTS idx_offering_papers_paper_id ON offering_papers(paper_id);
```

### 2. Frontend Changes

#### Form Changes
- **Single Dropdown** → **Checkbox List**
- **Single Selection** → **Multiple Selection**
- **paperId state** → **selectedPaperIds array**

#### Key Features
- ✅ **Checkbox Selection**: Users can select multiple papers
- ✅ **Visual Feedback**: Shows count of selected papers
- ✅ **Scrollable List**: Handles many paper options
- ✅ **Clear Indication**: Shows which papers are selected

### 3. Usage Examples

#### Example 1: ICT Class with Multiple Papers
```
Subject: ICT
Program: UNEB O-Level
Level: S1
Papers Selected:
☑️ 840/1 - Computer Studies
☑️ 840/2 - Computer Studies (Practical)
☐ 840/3 - Computer Studies (Theory)
```

#### Example 2: Mathematics Class
```
Subject: Mathematics
Program: UNEB O-Level
Level: S2
Papers Selected:
☑️ 402/1 - Mathematics (Core)
☑️ 402/2 - Mathematics (Additional)
```

#### Example 3: Single Paper Class
```
Subject: English
Program: UNEB O-Level
Level: S1
Papers Selected:
☑️ 112/1 - English Language
```

## Benefits of Multiple Paper Selection

### 1. **Flexibility**
- One class can offer multiple papers
- Students can take different papers in the same class
- Better resource utilization

### 2. **Realistic School Scenarios**
- **ICT Class**: Offers both theory and practical papers
- **Mathematics**: Offers core and additional mathematics
- **Languages**: Offers different language papers

### 3. **Better Organization**
- Clear separation of papers within the same subject
- Easier tracking of student progress
- Better reporting capabilities

## Implementation Status

### ✅ Completed
- Database schema design
- Frontend form modifications
- Multiple paper selection UI
- Form submission logic
- Table display updates

### 🔄 Next Steps
1. **Apply Database Changes**: Run the SQL script
2. **Test Functionality**: Create test offerings with multiple papers
3. **Update Types**: Add TypeScript types for new structure
4. **User Training**: Inform administrators about new feature

## Code Examples

### State Management
```javascript
const [selectedPaperIds, setSelectedPaperIds] = useState([]);
```

### Paper Selection
```javascript
<input
  type="checkbox"
  checked={selectedPaperIds.includes(p.paper_id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedPaperIds([...selectedPaperIds, p.paper_id]);
    } else {
      setSelectedPaperIds(selectedPaperIds.filter(id => id !== p.paper_id));
    }
  }}
/>
```

### Database Operations
```javascript
// Save paper associations
const paperAssociations = selectedPaperIds.map(paperId => ({
  offering_id: newOffering.id,
  paper_id: paperId
}));

await supabase
  .from('offering_papers')
  .insert(paperAssociations);
```

## Migration Strategy

### Option 1: Clean Migration (Recommended)
1. Create new `offering_papers` table
2. Migrate existing single paper selections
3. Remove old `paper_id` column
4. Update all frontend code

### Option 2: Hybrid Approach
1. Keep both single and multiple paper support
2. Allow gradual migration
3. Deprecate single paper over time

## User Interface Changes

### Before (Single Paper)
```
Paper (Optional) +10 options
[Dropdown: Select one paper]
⚠️ Multiple papers available - select the specific paper for this class
```

### After (Multiple Papers)
```
Papers (Optional) +10 options
☑️ 840/1 - Computer Studies
☑️ 840/2 - Computer Studies (Practical)
☐ 840/3 - Computer Studies (Theory)
✅ Select multiple papers if this class offers more than one paper
Selected: 2 papers
```

## Testing Scenarios

### Test Case 1: Single Paper Selection
1. Select one paper
2. Verify it saves correctly
3. Verify it displays correctly in table

### Test Case 2: Multiple Paper Selection
1. Select multiple papers
2. Verify all save correctly
3. Verify all display correctly in table

### Test Case 3: No Paper Selection
1. Don't select any papers
2. Verify offering saves without papers
3. Verify displays as "No specific papers"

### Test Case 4: Edit Existing Offering
1. Edit offering with multiple papers
2. Add/remove papers
3. Verify changes save correctly

## Notes

- **Backward Compatible**: Existing single-paper offerings continue to work
- **Performance**: Includes database indexes for optimal queries
- **User Experience**: Clear visual feedback for multiple selections
- **Scalability**: Can handle unlimited papers per offering
