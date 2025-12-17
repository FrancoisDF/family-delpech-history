# Genealogy Tree Diagram

Generated from Builder.io person model on **2025-12-17T21:44:51.681Z**

## Overview
- **Total people**: 15
- **Root ancestors**: 4

## Mermaid Diagram

```mermaid
graph TD
    antoine-grognier["antoine-grognier"]
    antoine-grognier-junior["antoine-grognier-junior"]
    claude-grognier["claude-grognier"]
    elizabeth-grognier["elizabeth-grognier"]
    felicite-grognier["felicite-grognier"]
    henri-delpech["henri-delpech"]
    jean-baptist-grognier["jean-baptist-grognier"]
    joseph-delpech-junior["joseph-delpech-junior"]
    joseph-delpech-senior["joseph-delpech-senior"]
    marguerite-blanc["marguerite-blanc"]
    marie-antoinette-delpech["marie-antoinette-delpech"]
    marie-louise-grognier["marie-louise-grognier"]
    pierre-delpech["pierre-delpech"]
    pierre-grognier-junior["pierre-grognier-junior"]
    rose-grognier["rose-grognier"]

    couple-antoine-grognier_marie-antoinette-delpech["antoine-grognier & marie-antoinette-delpech"]
    couple-marguerite-blanc_pierre-delpech["marguerite-blanc & pierre-delpech"]

    antoine-grognier --> couple-antoine-grognier_marie-antoinette-delpech
    marie-antoinette-delpech --> couple-antoine-grognier_marie-antoinette-delpech
    marguerite-blanc --> couple-marguerite-blanc_pierre-delpech
    pierre-delpech --> couple-marguerite-blanc_pierre-delpech

    joseph-delpech-senior --> joseph-delpech-junior
    couple-antoine-grognier_marie-antoinette-delpech --> marie-louise-grognier
    couple-antoine-grognier_marie-antoinette-delpech --> jean-baptist-grognier
    couple-antoine-grognier_marie-antoinette-delpech --> pierre-grognier-junior
    couple-antoine-grognier_marie-antoinette-delpech --> elizabeth-grognier
    couple-antoine-grognier_marie-antoinette-delpech --> claude-grognier
    couple-antoine-grognier_marie-antoinette-delpech --> rose-grognier
    couple-antoine-grognier_marie-antoinette-delpech --> antoine-grognier-junior
    couple-antoine-grognier_marie-antoinette-delpech --> felicite-grognier
    couple-marguerite-blanc_pierre-delpech --> marie-antoinette-delpech
    couple-marguerite-blanc_pierre-delpech --> joseph-delpech-senior
```

## How to Extend

To add new people to the genealogy tree:

1. Create a new person record in the **Builder.io person model**
2. Set the `personId` field to a unique kebab-case ID (e.g., `jean-doe`)
3. Fill in other fields: `givenName`, `familyName`, `displayName`, `birthDate`, `deathDate`, etc.
4. Run the generation script: `npm run generate:genealogy-tree`
5. Commit the updated `docs/genealogy-tree.md` file

## Notes

- **Person details are stored in Builder.io**: This file contains only the family tree structure (IDs and relationships)
- **Mermaid format**: The diagram uses Mermaid flowchart syntax, which is supported by GitHub, GitLab, and many markdown renderers
- **Automatic generation**: This file is auto-generated from the Builder person model — edit person records in Builder, not this file