/**
 * ProgramTemplates - Coaching program template definitions
 * 
 * Program Categories:
 * - General Wellness
 * - Weight Management
 * - Heart-Friendly Eating
 * 
 * Each program includes structured modules with learning content,
 * action items, and progress tracking.
 * 
 * @module coaching/services/ProgramTemplates
 */

// Program template definitions
export const PROGRAM_TEMPLATES = {
  // =====================
  // GENERAL WELLNESS
  // =====================
  'general-wellness': {
    id: 'general-wellness',
    name: 'General Wellness Foundations',
    description: 'Build a strong foundation for overall health and well-being with evidence-based practices.',
    category: 'wellness',
    duration: '4 weeks',
    difficulty: 'Beginner',
    icon: '🌟',
    color: 'var(--asr-purple-500)',
    imageUrl: null, // Placeholder for future image
    benefits: [
      'Improved energy levels',
      'Better sleep quality',
      'Reduced stress',
      'Healthier eating habits',
      'Sustainable lifestyle changes'
    ],
    targetAudience: 'Anyone looking to improve their overall health and establish sustainable wellness habits.',
    progress: 0,
    enrolled: false,
    modules: [
      {
        id: 'gw-1',
        week: 1,
        title: 'Understanding Your Wellness Baseline',
        description: 'Assess your current health status and identify areas for improvement.',
        content: `## Week 1: Know Where You Stand

Before making changes, it's important to understand your current baseline. This week, we'll assess your habits and set meaningful goals.

### Learning Objectives
- Understand the pillars of wellness (nutrition, movement, sleep, stress)
- Complete a self-assessment of current habits
- Identify your personal wellness priorities

### Key Concepts
**The 4 Pillars of Wellness:**
1. **Nutrition** - What and how you eat
2. **Movement** - Physical activity levels
3. **Sleep** - Quality and quantity of rest
4. **Stress** - Mental and emotional health

### Action Items
□ Complete the wellness self-assessment
□ Write down your top 3 wellness goals
□ Track your habits for one full week`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Complete wellness self-assessment',
          'Identify top 3 wellness goals',
          'Track daily habits for 7 days'
        ]
      },
      {
        id: 'gw-2',
        week: 1,
        title: 'Setting SMART Wellness Goals',
        description: 'Learn to create specific, measurable, and achievable health goals.',
        content: `## Setting Goals That Stick

Goals are the roadmap to better health. But not all goals are created equal.

### The SMART Framework
- **S**pecific - What exactly do you want to achieve?
- **M**easurable - How will you track progress?
- **A**chievable - Is this realistic for you?
- **R**elevant - Does this align with your values?
- **T**ime-bound - When will you achieve this?

### Example Transformations
❌ "I want to eat healthier"
✅ "I will eat 2 servings of vegetables with dinner 5 nights per week for the next month"

❌ "I want to exercise more"
✅ "I will walk for 20 minutes during lunch 3 times per week"

### Action Items
□ Rewrite your goals using SMART format
□ Share your goals with an accountability partner
□ Set up a simple tracking system`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Create 3 SMART goals',
          'Find an accountability partner',
          'Set up tracking system'
        ]
      },
      {
        id: 'gw-3',
        week: 2,
        title: 'Nutrition Fundamentals',
        description: 'Master the basics of balanced eating without restrictive dieting.',
        content: `## Eating for Energy and Health

Nutrition doesn't have to be complicated. Let's focus on the fundamentals.

### The Balanced Plate Method
- **½ plate** - Vegetables and fruits
- **¼ plate** - Lean protein
- **¼ plate** - Whole grains

### Key Nutrition Principles
1. **Eat the rainbow** - Variety of colorful produce
2. **Protein at every meal** - Supports satiety and muscle
3. **Hydrate first** - Often hunger is thirst
4. **Mindful portions** - Listen to your body

### Action Items
□ Practice the plate method for 5 meals
□ Add one new vegetable this week
□ Track water intake`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Use plate method for 5 meals',
          'Try one new vegetable',
          'Drink 8 glasses of water daily'
        ]
      },
      {
        id: 'gw-4',
        week: 2,
        title: 'Movement for Life',
        description: 'Incorporate enjoyable physical activity into your daily routine.',
        content: `## Making Movement a Habit

Exercise doesn't have to mean grueling gym sessions. Find what you enjoy!

### Types of Movement
- **Cardio** - Walking, swimming, dancing
- **Strength** - Bodyweight, weights, resistance bands
- **Flexibility** - Stretching, yoga
- **Daily activity** - Stairs, walking meetings, active hobbies

### The Minimum Effective Dose
- 150 minutes moderate activity per week
- That's just 22 minutes per day!
- Every minute counts

### Action Items
□ Try 3 different types of movement
□ Schedule movement like an appointment
□ Find a movement buddy`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Try 3 movement activities',
          'Schedule weekly movement sessions',
          'Find an exercise buddy'
        ]
      },
      {
        id: 'gw-5',
        week: 3,
        title: 'Sleep Optimization',
        description: 'Improve your sleep quality for better energy and health.',
        content: `## The Power of Quality Sleep

Sleep is when your body repairs and your brain consolidates learning.

### Sleep Hygiene Basics
- **Consistent schedule** - Same wake time daily
- **Dark environment** - Blackout curtains, no screens
- **Cool temperature** - 65-68°F ideal
- **Wind-down routine** - 30-60 minutes before bed

### Common Sleep Disruptors
- Caffeine after 2pm
- Alcohol before bed
- Blue light from screens
- Irregular schedule
- Heavy meals late at night

### Action Items
□ Set a consistent wake time
□ Create a wind-down routine
□ Optimize your sleep environment`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Set consistent wake time for 7 days',
          'Create 30-min wind-down routine',
          'Make bedroom darker and cooler'
        ]
      },
      {
        id: 'gw-6',
        week: 3,
        title: 'Stress Management Techniques',
        description: 'Learn practical strategies to manage daily stress.',
        content: `## Taking Control of Stress

Stress is inevitable. How you respond to it is what matters.

### Quick Stress Relievers (1-5 minutes)
- **Box breathing** - 4 in, 4 hold, 4 out, 4 hold
- **5-4-3-2-1 grounding** - Use your senses
- **Progressive muscle relaxation**
- **Brief walking break**

### Long-term Stress Management
- Regular physical activity
- Social connections
- Time in nature
- Mindfulness practice
- Adequate sleep

### Action Items
□ Practice box breathing daily
□ Identify your top 3 stressors
□ Schedule one stress-relief activity`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Practice box breathing 3x daily',
          'List top 3 stressors',
          'Do one stress-relief activity daily'
        ]
      },
      {
        id: 'gw-7',
        week: 4,
        title: 'Building Sustainable Habits',
        description: 'Create lasting change with proven habit-building strategies.',
        content: `## Making Wellness Automatic

The goal is to make healthy choices the easy choice.

### The Habit Loop
1. **Cue** - What triggers the behavior?
2. **Routine** - The behavior itself
3. **Reward** - The positive reinforcement

### Habit Stacking
Attach new habits to existing ones:
- "After I pour my coffee, I will drink a glass of water"
- "After I brush my teeth, I will do 5 minutes of stretching"

### Making It Easy
- Reduce friction for good habits
- Increase friction for bad habits
- Start incredibly small

### Action Items
□ Identify cues for your goals
□ Create 3 habit stacks
□ Remove one source of friction`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Identify cues for 3 habits',
          'Create 3 habit stacks',
          'Remove friction for one good habit'
        ]
      },
      {
        id: 'gw-8',
        week: 4,
        title: 'Your Wellness Plan Forward',
        description: 'Create your personalized ongoing wellness strategy.',
        content: `## Graduation: Your Path Forward

Congratulations on completing General Wellness Foundations! 🎉

### Reflection Questions
1. What was your biggest insight?
2. Which habit change has had the most impact?
3. What challenges did you overcome?

### Your Maintenance Plan
- **Daily non-negotiables** - What will you do every day?
- **Weekly check-ins** - How will you assess progress?
- **Monthly reviews** - What will you adjust?

### Continuing Your Journey
Consider these next steps:
- Advance to Weight Management or Heart-Friendly programs
- Use the AI Coach for ongoing support
- Track your progress in the app

### Action Items
□ Complete program reflection
□ Write your maintenance plan
□ Set your next wellness goal`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Complete reflection worksheet',
          'Create maintenance plan',
          'Set 1 new goal for next month'
        ]
      }
    ]
  },

  // =====================
  // WEIGHT MANAGEMENT
  // =====================
  'weight-management': {
    id: 'weight-management',
    name: 'Sustainable Weight Management',
    description: 'Evidence-based strategies for healthy, sustainable weight management without extreme dieting.',
    category: 'weight',
    duration: '6 weeks',
    difficulty: 'Intermediate',
    icon: '⚖️',
    color: 'var(--asr-orange-500)',
    imageUrl: null,
    benefits: [
      'Understanding of energy balance',
      'Sustainable eating patterns',
      'Improved metabolism',
      'Better relationship with food',
      'Long-term weight maintenance skills'
    ],
    targetAudience: 'Individuals looking to manage their weight through healthy, sustainable methods rather than quick fixes.',
    progress: 0,
    enrolled: false,
    modules: [
      {
        id: 'wm-1',
        week: 1,
        title: 'Understanding Energy Balance',
        description: 'Learn the science of calories and metabolism without obsessing over numbers.',
        content: `## The Science of Weight Management

Weight management is fundamentally about energy balance - but it's more nuanced than "calories in, calories out."

### Key Concepts
**Total Daily Energy Expenditure (TDEE):**
- Basal Metabolic Rate (BMR) - 60-70%
- Thermic Effect of Food - 10%
- Physical Activity - 20-30%

### The Calorie Myth
Not all calories are equal in terms of:
- Satiety (how full you feel)
- Thermic effect (energy to digest)
- Hormonal response
- Nutrient density

### A Balanced Approach
- Moderate deficit (250-500 cal/day)
- Focus on food quality
- Don't go below 1200/1500 calories
- Patience over perfection

### Action Items
□ Calculate your estimated TDEE
□ Track food for 3 days (no judgment)
□ Identify your eating patterns`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Estimate TDEE using online calculator',
          'Track food intake for 3 days',
          'Note eating patterns and triggers'
        ]
      },
      {
        id: 'wm-2',
        week: 1,
        title: 'Protein: Your Weight Management Ally',
        description: 'Why protein is crucial for sustainable weight management.',
        content: `## The Power of Protein

Protein is your best friend for weight management.

### Why Protein Matters
1. **Highest satiety** - Keeps you full longer
2. **Thermic effect** - Burns 20-30% of calories to digest
3. **Muscle preservation** - Maintains metabolism
4. **Stable blood sugar** - Fewer cravings

### How Much Protein?
- General: 0.8-1g per pound of goal body weight
- Active: 1-1.2g per pound
- Spread throughout the day (25-40g per meal)

### Protein Sources
- Chicken, turkey, fish
- Eggs, Greek yogurt
- Legumes, tofu
- Protein supplements (if needed)

### Action Items
□ Calculate your protein target
□ Include protein at every meal
□ Try one new protein source`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Calculate daily protein goal',
          'Add protein to every meal for 5 days',
          'Try one new protein source this week'
        ]
      },
      {
        id: 'wm-3',
        week: 2,
        title: 'Volume Eating Strategies',
        description: 'Eat more food while consuming fewer calories.',
        content: `## Eat More, Weigh Less

Volume eating focuses on foods that are low in calorie density but high in volume.

### Calorie Density Spectrum
**Low density (eat freely):**
- Non-starchy vegetables
- Leafy greens
- Berries, melon
- Broth-based soups

**Medium density (moderate portions):**
- Lean proteins
- Whole grains
- Legumes
- Fruits

**High density (small portions):**
- Oils, butter
- Nuts, cheese
- Dried fruits
- Processed snacks

### Volume Eating Tips
- Start meals with salad or soup
- Use the "half plate vegetables" rule
- Add veggies to everything
- Choose whole fruits over juice

### Action Items
□ Start 3 meals with vegetables
□ Identify calorie-dense foods to moderate
□ Make one volume-swap per day`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Start 3 meals with vegetables/salad',
          'List high-calorie foods to reduce',
          'Make one volume swap daily'
        ]
      },
      {
        id: 'wm-4',
        week: 2,
        title: 'Managing Hunger and Cravings',
        description: 'Strategies to handle hunger without willpower depletion.',
        content: `## Working With Your Body, Not Against It

Hunger is a signal, not an enemy. Let's understand it.

### Types of Hunger
1. **Physical hunger** - Gradual, stomach-based, any food sounds good
2. **Emotional hunger** - Sudden, head-based, specific foods wanted
3. **Habit hunger** - Time-based, automatic eating

### Craving Management
- **Delay** - Wait 10 minutes, drink water
- **Distract** - Call a friend, take a walk
- **Decide** - Is this physical or emotional?
- **Diminish** - Have a small portion mindfully

### Preventing Excessive Hunger
- Don't skip meals
- Include protein and fiber
- Stay hydrated
- Get enough sleep
- Manage stress

### Action Items
□ Practice the hunger scale (1-10)
□ Use "delay and decide" for cravings
□ Identify your emotional eating triggers`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Rate hunger before eating for 5 days',
          'Delay cravings by 10 minutes',
          'List emotional eating triggers'
        ]
      },
      {
        id: 'wm-5',
        week: 3,
        title: 'Exercise for Weight Management',
        description: 'The role of physical activity in sustainable weight management.',
        content: `## Movement That Matters

Exercise isn't just about burning calories - it's about building a body that's efficient and healthy.

### Exercise Benefits Beyond Calories
- Preserves muscle mass
- Improves insulin sensitivity
- Boosts mood and energy
- Increases NEAT (non-exercise activity)
- Improves sleep quality

### The Exercise Hierarchy for Weight Management
1. **Strength training** - Build/preserve muscle (2-3x/week)
2. **Daily movement** - Steps, standing, activity
3. **Cardio** - Heart health, additional burn
4. **NEAT** - Fidgeting, stairs, walking

### Important Notes
- You can't out-exercise a bad diet
- Exercise increases hunger - plan for it
- Focus on consistency over intensity
- Find activities you enjoy

### Action Items
□ Add one strength session this week
□ Increase daily steps by 1000
□ Find one enjoyable physical activity`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Do one strength training session',
          'Track steps and increase by 1000',
          'Try one new physical activity'
        ]
      },
      {
        id: 'wm-6',
        week: 3,
        title: 'Mindful Eating Practices',
        description: 'Develop a healthier relationship with food through awareness.',
        content: `## Eating With Awareness

Mindful eating isn't a diet - it's a way of eating.

### Mindful Eating Principles
- Eat slowly (20+ minutes per meal)
- Remove distractions
- Notice flavors, textures, satisfaction
- Recognize fullness cues
- Eat without judgment

### The Hunger-Fullness Scale
1-2: Starving (don't let yourself get here)
3-4: Hungry (time to eat)
5-6: Satisfied (stop here)
7-8: Full (you went too far)
9-10: Stuffed (uncomfortable)

### Practical Strategies
- Put fork down between bites
- Chew thoroughly (20-30 times)
- Use smaller plates
- Serve from kitchen, not table
- Pause halfway through meal

### Action Items
□ Eat one meal fully mindfully
□ Practice the hunger-fullness scale
□ Remove screens during one meal daily`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Practice fully mindful eating once',
          'Use hunger scale for 5 days',
          'Screen-free meal once daily'
        ]
      },
      {
        id: 'wm-7',
        week: 4,
        title: 'Navigating Social Eating',
        description: 'Strategies for restaurants, parties, and social situations.',
        content: `## Staying on Track in Real Life

Weight management happens in the real world - with restaurants, parties, and holidays.

### Restaurant Strategies
- Check menu beforehand
- Eat a small snack before
- Order first (avoid influence)
- Ask for dressings/sauces on side
- Box half before starting

### Party and Event Tips
- Eat normally beforehand
- Survey all options first
- Use a small plate
- Stand away from food table
- Focus on socializing

### The 80/20 Approach
- 80% nutritious, planned eating
- 20% flexible, enjoyable eating
- No food is "off limits"
- One meal won't make or break you

### Action Items
□ Plan for one social eating event
□ Practice restaurant strategies
□ Reflect on a past challenging situation`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Plan approach for upcoming event',
          'Use restaurant strategy this week',
          'Write about past challenge + solution'
        ]
      },
      {
        id: 'wm-8',
        week: 4,
        title: 'Plateau Busting and Adaptation',
        description: 'What to do when progress stalls.',
        content: `## When the Scale Won't Budge

Plateaus are normal. Here's how to handle them.

### Why Plateaus Happen
- Metabolic adaptation
- Water retention masking fat loss
- Unconscious calorie creep
- Reduced NEAT
- Muscle gain (good thing!)

### Breaking a Plateau
1. **Reassess** - Are you in a true plateau (4+ weeks)?
2. **Track accurately** - Are you measuring correctly?
3. **Increase protein** - Supports metabolism
4. **Add movement** - Especially strength training
5. **Diet break** - Sometimes eating more helps

### When NOT to Worry
- Weight fluctuates 2-5 lbs daily
- Whooshes happen (sudden drops)
- Scale isn't only metric

### Non-Scale Victories
- Clothes fitting better
- More energy
- Better sleep
- Improved mood
- Health markers improving

### Action Items
□ Track non-scale victories
□ Review tracking accuracy
□ Consider a strategic diet break`,
        completed: false,
        completedAt: null,
        actionItems: [
          'List 5 non-scale victories',
          'Audit tracking for one week',
          'Research diet breaks'
        ]
      },
      {
        id: 'wm-9',
        week: 5,
        title: 'Sleep and Stress Impact',
        description: 'How sleep and stress affect weight management.',
        content: `## The Hidden Weight Factors

Sleep and stress can sabotage your best efforts.

### Sleep and Weight
**Lack of sleep causes:**
- Increased ghrelin (hunger hormone)
- Decreased leptin (fullness hormone)
- More cravings for high-calorie foods
- Reduced willpower
- Lower activity levels

### Stress and Weight
**Chronic stress leads to:**
- Elevated cortisol
- Increased belly fat storage
- Emotional eating
- Disrupted sleep
- Lower motivation

### Optimization Strategies
**For sleep:**
- 7-9 hours per night
- Consistent schedule
- Cool, dark room
- No caffeine after 2pm

**For stress:**
- Daily relaxation practice
- Regular exercise
- Social connection
- Time in nature
- Boundaries with work

### Action Items
□ Audit your sleep habits
□ Identify top stressors
□ Add one stress-management practice`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Track sleep for one week',
          'List top 3 stressors',
          'Practice stress relief daily'
        ]
      },
      {
        id: 'wm-10',
        week: 5,
        title: 'Building Your Support System',
        description: 'The importance of accountability and support.',
        content: `## You Don't Have to Do This Alone

Support makes success more likely.

### Types of Support
1. **Accountability partner** - Regular check-ins
2. **Community** - Groups with similar goals
3. **Professional** - Coaches, dietitians
4. **Environmental** - Household alignment

### Finding Support
- Apps and online communities
- Local fitness groups
- Friends with similar goals
- Family involvement
- Professional guidance

### Being a Good Support Partner
- Celebrate wins
- No judgment on setbacks
- Focus on behaviors, not weight
- Lead by example
- Respect boundaries

### Action Items
□ Identify your support needs
□ Reach out to one potential supporter
□ Consider professional help if needed`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Identify support needs',
          'Contact one potential supporter',
          'Research professional options'
        ]
      },
      {
        id: 'wm-11',
        week: 6,
        title: 'Maintenance Mindset',
        description: 'Transitioning from losing to maintaining.',
        content: `## The Real Goal: Keeping It Off

Maintenance is where most people struggle. Let's prepare.

### Maintenance Challenges
- Thinking you're "done"
- Return to old habits
- All-or-nothing thinking
- Life circumstances change
- Reduced motivation

### Maintenance Strategies
- Gradual calorie increase
- Continue tracking periodically
- Maintain exercise routine
- Weight range (not single number)
- Quick intervention protocol

### Your Maintenance Plan
**Daily:**
- Protein at every meal
- Movement goal
- Mindful eating

**Weekly:**
- One tracking day
- Weight check
- Meal prep

**Monthly:**
- Review and adjust
- Celebrate progress
- Set new goals

### Action Items
□ Calculate maintenance calories
□ Set your weight range
□ Create your maintenance plan`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Calculate maintenance calories',
          'Set 5-pound weight range',
          'Write detailed maintenance plan'
        ]
      },
      {
        id: 'wm-12',
        week: 6,
        title: 'Your Personalized Path Forward',
        description: 'Create your long-term weight management strategy.',
        content: `## Graduation: Your Journey Continues

Congratulations on completing Sustainable Weight Management! 🎉

### Reflection
- What strategies worked best for you?
- What was most challenging?
- What will you continue?

### Your Personal Protocol
Create your "If-Then" plan:
- IF I notice weight up 5+ lbs, THEN I will...
- IF I'm stress eating, THEN I will...
- IF I skip workouts, THEN I will...

### Long-Term Success Factors
✅ Flexible approach (no forbidden foods)
✅ Regular physical activity
✅ Monitoring (tracking or weigh-ins)
✅ Support system
✅ Healthy coping mechanisms

### Next Steps
- Continue using the AI Coach
- Try Heart-Friendly Eating program
- Set new fitness goals
- Celebrate your success!

### Action Items
□ Complete reflection worksheet
□ Create your If-Then protocol
□ Set your next goal`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Complete program reflection',
          'Write If-Then protocol',
          'Set next 3-month goal'
        ]
      }
    ]
  },

  // =====================
  // HEART-FRIENDLY EATING
  // =====================
  'heart-friendly': {
    id: 'heart-friendly',
    name: 'Heart-Friendly Eating',
    description: 'Evidence-based dietary strategies to support cardiovascular health.',
    category: 'heart',
    duration: '4 weeks',
    difficulty: 'Beginner',
    icon: '❤️',
    color: 'var(--asr-red-500)',
    imageUrl: null,
    benefits: [
      'Improved cholesterol levels',
      'Better blood pressure',
      'Reduced inflammation',
      'Heart-healthy meal ideas',
      'Sustainable dietary changes'
    ],
    targetAudience: 'Anyone interested in eating patterns that support heart health. Not a replacement for medical treatment.',
    disclaimer: 'This program provides general nutrition information and is not intended as medical advice. Please consult your healthcare provider before making significant dietary changes, especially if you have existing heart conditions.',
    progress: 0,
    enrolled: false,
    modules: [
      {
        id: 'hf-1',
        week: 1,
        title: 'Introduction to Heart-Healthy Eating',
        description: 'Understanding the connection between diet and heart health.',
        content: `## Food and Your Heart

Diet plays a crucial role in heart health. Let's understand the connection.

### ⚠️ Important Disclaimer
This program provides general nutrition education. It is NOT a substitute for medical advice. Always consult your healthcare provider about diet changes, especially if you have existing heart conditions.

### Dietary Factors That Affect Heart Health
**Can improve:**
- Fiber
- Omega-3 fatty acids
- Antioxidants
- Plant sterols

**Should limit:**
- Saturated fat
- Trans fat
- Sodium
- Added sugars

### Heart-Healthy Eating Patterns
Research supports:
- Mediterranean diet
- DASH diet
- Plant-forward eating
- Whole food focus

### Action Items
□ Review your current eating pattern
□ Consult your doctor if needed
□ Identify one area to improve`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Assess current eating patterns',
          'Schedule doctor check if needed',
          'Choose one focus area'
        ]
      },
      {
        id: 'hf-2',
        week: 1,
        title: 'Understanding Heart-Healthy Fats',
        description: 'Not all fats are created equal - learn which to embrace.',
        content: `## The Fat Facts

Fat is essential - but type matters more than amount.

### Heart-Friendly Fats
**Unsaturated fats (increase these):**
- Olive oil, avocado oil
- Nuts and seeds
- Fatty fish (salmon, mackerel)
- Avocados

**Omega-3s (especially beneficial):**
- Fatty fish 2x per week
- Walnuts, flaxseed
- Chia seeds

### Fats to Limit
**Saturated fats:**
- Fatty red meat
- Full-fat dairy
- Coconut oil (in excess)
- Processed meats

**Trans fats (avoid):**
- Partially hydrogenated oils
- Some fried foods
- Some baked goods

### Practical Swaps
- Butter → Olive oil
- Chips → Nuts
- Fried food → Baked/grilled
- Cream sauce → Olive oil-based

### Action Items
□ Cook with olive oil this week
□ Add fatty fish to one meal
□ Swap one saturated fat source`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Use olive oil for cooking',
          'Eat fatty fish once this week',
          'Make one fat swap'
        ]
      },
      {
        id: 'hf-3',
        week: 2,
        title: 'Fiber for Heart Health',
        description: 'How fiber supports your cardiovascular system.',
        content: `## The Fiber Effect

Fiber is a heart-health superstar.

### How Fiber Helps
- Lowers LDL cholesterol
- Supports healthy blood pressure
- Aids blood sugar control
- Promotes healthy weight
- Feeds beneficial gut bacteria

### Types of Fiber
**Soluble fiber (cholesterol-lowering):**
- Oats, barley
- Beans, lentils
- Apples, citrus
- Psyllium

**Insoluble fiber (digestive health):**
- Whole grains
- Vegetables
- Nuts, seeds

### Fiber Goals
- Women: 25g per day
- Men: 38g per day
- Increase gradually to avoid discomfort
- Drink plenty of water

### Easy Fiber Additions
- Oatmeal for breakfast
- Beans in salads/soups
- Whole fruit for snacks
- Extra vegetables at dinner

### Action Items
□ Calculate current fiber intake
□ Add one fiber source daily
□ Try a new legume recipe`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Estimate current fiber intake',
          'Add fiber at one meal daily',
          'Try one new bean/lentil recipe'
        ]
      },
      {
        id: 'hf-4',
        week: 2,
        title: 'Managing Sodium',
        description: 'Strategies to reduce sodium without sacrificing flavor.',
        content: `## Sodium and Your Heart

High sodium intake is linked to high blood pressure.

### The Numbers
- Recommended: <2,300mg/day
- Ideal: <1,500mg/day
- Average American: 3,400mg/day
- 70% comes from processed/restaurant food

### Hidden Sodium Sources
- Bread and rolls
- Cold cuts and cured meats
- Pizza
- Soup (canned)
- Sandwiches
- Condiments

### Reducing Sodium
**At home:**
- Cook from scratch more often
- Use herbs and spices
- Rinse canned beans
- Choose low-sodium versions

**Eating out:**
- Ask for less salt
- Sauce on the side
- Skip the bread basket
- Share entrees

### Flavor Without Salt
- Citrus (lemon, lime)
- Vinegars
- Fresh herbs
- Garlic, onion
- Spices (no salt blends)

### Action Items
□ Read labels for sodium content
□ Cook one low-sodium meal
□ Try a salt-free seasoning blend`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Check sodium on 5 food labels',
          'Make one low-sodium recipe',
          'Buy/make salt-free seasoning'
        ]
      },
      {
        id: 'hf-5',
        week: 3,
        title: 'The Power of Plants',
        description: 'Why plant foods are central to heart health.',
        content: `## Plants for Your Heart

Plant-forward eating consistently shows heart benefits.

### Why Plants?
- Rich in fiber
- Low in saturated fat
- High in antioxidants
- Contain plant sterols
- Anti-inflammatory compounds

### Heart-Healthy Plant Foods
**Vegetables (unlimited):**
- Leafy greens
- Cruciferous (broccoli, cauliflower)
- Colorful varieties

**Fruits (2-4 servings):**
- Berries (high antioxidants)
- Citrus
- Apples, pears

**Whole grains (6+ servings):**
- Oats, barley
- Quinoa, brown rice
- Whole wheat

**Legumes (aim for daily):**
- Beans, lentils
- Chickpeas
- Edamame

### Plant-Forward Strategies
- Meatless Monday
- Half your plate vegetables
- Beans in place of meat sometimes
- Fruit for dessert

### Action Items
□ Add one extra vegetable serving daily
□ Try one meatless meal
□ Explore a new plant food`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Extra vegetable serving daily',
          'One meatless meal this week',
          'Try one new plant food'
        ]
      },
      {
        id: 'hf-6',
        week: 3,
        title: 'The Mediterranean Way',
        description: 'Learn from one of the most studied heart-healthy diets.',
        content: `## Mediterranean Eating

The Mediterranean diet has strong evidence for heart health.

### Key Components
1. **Abundant:** Vegetables, fruits, whole grains, legumes
2. **Daily:** Olive oil, nuts, herbs/spices
3. **Weekly:** Fish/seafood 2-3x, poultry, eggs
4. **Moderate:** Dairy (mostly yogurt, cheese)
5. **Limited:** Red meat, sweets

### Beyond Food
Mediterranean lifestyle includes:
- Meals with family/friends
- Physical activity
- Rest and leisure
- Moderate wine (optional)

### Mediterranean Meal Ideas
**Breakfast:** Greek yogurt, berries, walnuts
**Lunch:** Grain bowl with chickpeas, vegetables, olive oil
**Dinner:** Grilled fish, roasted vegetables, whole grain

### Getting Started
- Switch to olive oil
- Add fish twice weekly
- Include nuts as snacks
- Embrace legumes

### Action Items
□ Make olive oil your primary cooking fat
□ Plan a Mediterranean-inspired meal
□ Add nuts as a daily snack`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Use olive oil as main cooking fat',
          'Cook one Mediterranean meal',
          'Snack on nuts instead of chips'
        ]
      },
      {
        id: 'hf-7',
        week: 4,
        title: 'Heart-Healthy Meal Planning',
        description: 'Putting it all together with practical meal planning.',
        content: `## Planning Heart-Healthy Meals

Let's apply what you've learned to real meal planning.

### Weekly Planning Template
**Each day, aim for:**
- 5+ servings vegetables/fruits
- 3+ servings whole grains
- Healthy fats at each meal
- Protein focus on fish, poultry, legumes

### Sample Day
**Breakfast:**
- Oatmeal with berries and walnuts
- Green tea

**Lunch:**
- Large salad with chickpeas
- Olive oil vinaigrette
- Whole grain bread

**Snack:**
- Apple with almond butter

**Dinner:**
- Baked salmon
- Roasted vegetables
- Quinoa

### Meal Prep Tips
- Prep vegetables on Sunday
- Cook whole grains in batches
- Keep canned beans on hand
- Frozen fish is great

### Action Items
□ Plan a full week of heart-healthy meals
□ Create a shopping list
□ Prep ingredients for the week`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Plan 7 days of meals',
          'Create shopping list',
          'Sunday meal prep'
        ]
      },
      {
        id: 'hf-8',
        week: 4,
        title: 'Your Heart-Healthy Future',
        description: 'Sustaining heart-healthy eating for life.',
        content: `## Graduation: Heart Health for Life

Congratulations on completing Heart-Friendly Eating! 🎉

### Your Accomplishments
- Understanding of heart-healthy fats
- Increased fiber intake
- Sodium awareness
- Plant-forward eating skills
- Mediterranean diet principles

### Maintaining Progress
**Continue to:**
- Use olive oil as primary fat
- Eat fatty fish 2x weekly
- Include fiber at every meal
- Limit sodium and processed foods
- Fill half your plate with plants

### Regular Check-ups
Remember to:
- Get regular cholesterol checks
- Monitor blood pressure
- Discuss diet with your doctor
- Adjust based on test results

### Continuing Your Journey
- Use our Meal Planner for heart-healthy recipes
- Chat with AI Coach for ongoing support
- Consider Weight Management program
- Share what you've learned with family

### Action Items
□ Complete program reflection
□ Schedule health check-up
□ Set ongoing heart-health goals`,
        completed: false,
        completedAt: null,
        actionItems: [
          'Complete reflection worksheet',
          'Schedule cholesterol check',
          'Set 3 ongoing goals'
        ]
      }
    ]
  }
};

/**
 * Get all available program templates
 * @returns {Array} - Array of program objects
 */
export function getAllPrograms() {
  return Object.values(PROGRAM_TEMPLATES);
}

/**
 * Get program by ID
 * @param {string} programId - Program ID
 * @returns {Object|null} - Program object or null
 */
export function getProgramById(programId) {
  return PROGRAM_TEMPLATES[programId] || null;
}

/**
 * Get programs by category
 * @param {string} category - Category name (wellness, weight, heart)
 * @returns {Array} - Programs in category
 */
export function getProgramsByCategory(category) {
  return Object.values(PROGRAM_TEMPLATES).filter(p => p.category === category);
}

/**
 * Initialize programs for a user (copies templates)
 * @returns {Array} - User's program instances
 */
export function initializeUserPrograms() {
  return Object.values(PROGRAM_TEMPLATES).map(program => ({
    ...program,
    modules: program.modules.map(module => ({
      ...module,
      completed: false,
      completedAt: null
    })),
    progress: 0,
    enrolled: false,
    startedAt: null,
    completedAt: null
  }));
}

export default PROGRAM_TEMPLATES;
