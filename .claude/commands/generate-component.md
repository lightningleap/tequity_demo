--- 
description : create a component in @components/ui/
argument hint : component name | component summary
---

# context
parse $Arguments to follow the following values
-[name] : component name from the $Arguments 
-[description] : component description from the $Arguments


# Tasks 

make a single ui component following are guidelines

create the component file in @src\components\ui folder

# Variants
...

# Testing

make a test @src\components\ui\Button\Button.test.tsx  as a reference create a test file for new component.
-- run tests and iterate until they pass.

# Preview

now render the component in the @src\pages\preview.tsx page  so it can be viewed on the browser and use different variants

-- dont not add the component to any other page

## Review 
-  First invoke the **ui-ux-playwright-reviewer**
 and  review the component use its feedback to improve the component.