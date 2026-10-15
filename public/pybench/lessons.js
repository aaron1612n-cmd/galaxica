/* Pybench content: lessons with checked exercises, the cheat sheet, and examples. */
window.PB = window.PB || {};

PB.welcome = `# Welcome to Pybench.
# This is the editor. Press Run (F5)
# and watch the shell.

name = "world"
print(f"Hello, {name}!")

for n in range(1, 6):
    print(n, "squared is", n * n)

# Next, type  2 + 2  in the shell
# and press Enter. Lessons are in Learn.
`;

PB.lessons = [
{ id:'print', title:'Printing and strings',
  body:[
  ['p','A program is a list of instructions. `print()` shows a value in the shell. Text goes inside quotes and is called a string.'],
  ['code','print("Hello!")\nprint(\'Single quotes work too\')\nprint("Numbers need no quotes:", 42)'],
  ['p','Give `print` several values, separated by commas, and it puts a space between them. Strings can be joined with `+` and repeated with `*`.'],
  ['code','print("ab" + "cd")\nprint("ha" * 3)']],
  task:{ text:'Print exactly two lines: `Hello, Python` and then `I am learning`.',
    starter:'# write two print() lines\n',
    check:`lines = OUTPUT.strip().splitlines()
assert len(lines) == 2, f"Expected 2 lines of output, got {len(lines)}."
assert lines[0].strip() == "Hello, Python", f"First line should be 'Hello, Python', not {lines[0]!r}."
assert lines[1].strip() == "I am learning", f"Second line should be 'I am learning', not {lines[1]!r}."`,
    hint:'print("Hello, Python") on one line, the other print on the next.' } },

{ id:'vars', title:'Variables and numbers',
  body:[
  ['p','A variable is a name that holds a value. `=` means "store the value on the right in the name on the left".'],
  ['code','apples = 5\npears = 3\ntotal = apples + pears\nprint(total)'],
  ['p','Python does maths with `+ - * /`. `//` divides and drops the remainder, `%` gives the remainder, `**` is power.'],
  ['code','print(7 / 2, 7 // 2, 7 % 2, 2 ** 10)'],
  ['p','Watch the Vars panel after you run code: it lists every variable and its value.']],
  task:{ text:'Make a variable `width` set to 8 and `height` set to 5. Make `area` equal to width times height, then print it.',
    starter:'width = \nheight = \n',
    check:`assert 'width' in dir() and width == 8, "width should be 8."
assert 'height' in dir() and height == 5, "height should be 5."
assert 'area' in dir(), "Make a variable called area."
assert area == 40, f"area should be width * height (40), but it is {area!r}."
assert "40" in OUTPUT, "Print area at the end."`,
    hint:'area = width * height   then   print(area)' } },

{ id:'input', title:'Asking questions with input()',
  body:[
  ['p','`input()` waits for the user to type something and press Enter. It always gives back a string.'],
  ['code','name = input("What is your name? ")\nprint("Nice to meet you,", name)'],
  ['p','To do maths with what was typed, turn the string into a number with `int()` or `float()`.'],
  ['code','age = int(input("Age? "))\nprint("Next year you will be", age + 1)']],
  task:{ text:'Ask for a number with `input()`, then print the number doubled. (The checker will type 21 and expect 42.)',
    starter:'n = input("Number? ")\n',
    stdin:['21'],
    check:`assert "42" in OUTPUT, "When the user types 21 your program should print 42. Did you convert with int()?"`,
    hint:'n = int(input("Number? "))  then  print(n * 2)' } },

{ id:'if', title:'Decisions: if, elif, else',
  body:[
  ['p','`if` runs a block only when a condition is True. The block is the indented lines under the colon.'],
  ['code','temp = 31\nif temp > 30:\n    print("Hot")\nelif temp > 15:\n    print("Nice")\nelse:\n    print("Cold")'],
  ['p','Compare with `==` (equal), `!=`, `<`, `>`, `<=`, `>=`. Combine with `and`, `or`, `not`. One `=` stores a value; two `==` compare.']],
  task:{ text:'Write a function-free program: read a whole number with input(). Print `even` if it is even, otherwise `odd`. (Tested with 7 and 10.)',
    starter:'n = int(input())\n',
    stdin:['7'],
    check:`assert OUTPUT.strip().splitlines()[-1].strip() == "odd", "For 7 the last line printed should be: odd"
import builtins as _b, io as _io, sys as _s
_feed = ["10"]; _o = _io.StringIO(); _old = _s.stdout; _s.stdout = _o
_inp = _b.input; _b.input = lambda p='': _feed.pop(0)
try:
    exec(compile(SOURCE, '<again>', 'exec'), {'__name__': '__main__'})
finally:
    _s.stdout = _old; _b.input = _inp
assert _o.getvalue().strip().splitlines()[-1].strip() == "even", "For 10 the last line printed should be: even"`,
    hint:'n % 2 == 0 is True for even numbers.' } },

{ id:'while', title:'Loops: while',
  body:[
  ['p','`while` repeats a block as long as its condition stays True. Something inside the loop must change, or it never ends. (If that happens, press Stop or Ctrl+C.)'],
  ['code','count = 3\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint("Lift off")'],
  ['p','`break` leaves a loop early. `count += 1` is short for `count = count + 1`.']],
  task:{ text:'Print the powers of two that are less than 1000, one per line: 1, 2, 4 ... 512.',
    starter:'p = 1\n',
    check:`got = [l.strip() for l in OUTPUT.split()]
want = [str(2**i) for i in range(10)]
assert got == want, f"Expected {' '.join(want)} but got {' '.join(got) or 'nothing'}."`,
    hint:'while p < 1000:  print(p)  then  p = p * 2' } },

{ id:'for', title:'Loops: for and range()',
  body:[
  ['p','`for` takes the items of a sequence one at a time. `range(n)` counts 0, 1 ... n-1. `range(a, b)` counts from a up to b-1.'],
  ['code','for i in range(5):\n    print(i)\n\nfor letter in "hey":\n    print(letter.upper())'],
  ['p','A loop inside a loop runs the inner one completely for each step of the outer one.'],
  ['code','for row in range(1, 4):\n    print("*" * row)']],
  task:{ text:'Add up all the whole numbers from 1 to 100 using a for loop, store the result in `total`, and print it.',
    starter:'total = 0\n',
    check:`assert 'total' in dir() and total == 5050, f"total should be 5050, got {globals().get('total')!r}. Remember range(1, 101) stops before 101."
assert "5050" in OUTPUT, "Print total at the end."
assert "for" in SOURCE, "Use a for loop."`,
    hint:'for n in range(1, 101):  total += n' } },

{ id:'lists', title:'Lists',
  body:[
  ['p','A list holds many values in order, inside square brackets. Positions (indexes) start at 0; `-1` is the last item.'],
  ['code','pets = ["cat", "dog", "newt"]\nprint(pets[0], pets[-1], len(pets))\npets.append("owl")\nprint(pets)'],
  ['p','Slices take a part: `pets[1:3]`. Useful tools: `sum()`, `max()`, `min()`, `sorted()`, `x in list`.']],
  task:{ text:'Given `scores = [12, 7, 19, 3, 15]`, make `best` the highest score, `top3` a list of the three highest (largest first), and print both.',
    starter:'scores = [12, 7, 19, 3, 15]\n',
    check:`assert best == 19, "best should be 19. Try max()."
assert top3 == [19, 15, 12], f"top3 should be [19, 15, 12], got {top3!r}. Try sorted(scores, reverse=True)[:3]."`,
    hint:'best = max(scores);  top3 = sorted(scores, reverse=True)[:3]' } },

{ id:'funcs', title:'Functions',
  body:[
  ['p','`def` makes your own command. The names in brackets are parameters: the values you hand in. Indented lines are the body.'],
  ['code','def greet(name):\n    print("Hi,", name)\n\ngreet("Ada")\ngreet("Linus")'],
  ['p','`return` sends a value back to whoever called the function. Without it, a function gives back `None`.'],
  ['code','def square(x):\n    return x * x\n\nprint(square(9) + 1)'],
  ['p','Type `square(` in the shell after running and a call tip shows its parameters.']],
  task:{ text:'Write a function `fahrenheit(c)` that returns the temperature in Fahrenheit (c * 9 / 5 + 32).',
    starter:'def fahrenheit(c):\n    \n',
    check:`assert 'fahrenheit' in dir(), "Define a function called fahrenheit."
assert fahrenheit(0) == 32, f"fahrenheit(0) should return 32, it returned {fahrenheit(0)!r}. Did you use return?"
assert fahrenheit(100) == 212, "fahrenheit(100) should be 212."
assert abs(fahrenheit(-40) + 40) < 1e-9, "fahrenheit(-40) should be -40."`,
    hint:'return c * 9 / 5 + 32' } },

{ id:'strings', title:'String tools and f-strings',
  body:[
  ['p','Strings have methods: `.upper()`, `.lower()`, `.strip()`, `.replace(a, b)`, `.split()`, `.startswith()`, `.count()`. They never change the original; they give a new string.'],
  ['code','s = "  Hello World  "\nprint(s.strip().lower())\nprint("a,b,c".split(","))\nprint("-".join(["x", "y", "z"]))'],
  ['p','An f-string puts values inside text with curly brackets. Add `:.2f` for two decimals.'],
  ['code','price = 3.5\nprint(f"Total: {price * 3:.2f} pounds")']],
  task:{ text:'Write `initials(full_name)` that returns the capital initials with dots, so `initials("ada lovelace")` gives `"A.L."`.',
    starter:'def initials(full_name):\n    \n',
    check:`assert initials("ada lovelace") == "A.L.", f'initials("ada lovelace") gave {initials("ada lovelace")!r}, expected "A.L."'
assert initials("grace brewster hopper") == "G.B.H.", "Three names should give three initials."`,
    hint:'Loop over full_name.split() and add word[0].upper() + "."' } },

{ id:'dicts', title:'Dictionaries',
  body:[
  ['p','A dictionary maps keys to values, like a word to its meaning. Look things up with square brackets.'],
  ['code','ages = {"ada": 36, "alan": 41}\nprint(ages["ada"])\nages["grace"] = 85\nfor name, age in ages.items():\n    print(name, age)'],
  ['p','`d.get(key, default)` avoids a KeyError when the key is missing. `key in d` checks first.']],
  task:{ text:'Write `count_words(text)` that returns a dictionary of how many times each word appears. `count_words("a b a")` gives `{"a": 2, "b": 1}`.',
    starter:'def count_words(text):\n    counts = {}\n    \n    return counts\n',
    check:`assert count_words("a b a") == {"a": 2, "b": 1}, f'count_words("a b a") gave {count_words("a b a")!r}'
assert count_words("") == {}, "An empty text should give an empty dictionary."
assert count_words("to be or not to be")["be"] == 2, "Count every word."`,
    hint:'for w in text.split():  counts[w] = counts.get(w, 0) + 1' } },

{ id:'errors', title:'Reading errors, try and except',
  body:[
  ['p','An error message is a clue, not a punishment. Read the last line first: it names the error. The lines above show where it happened; click one to jump there.'],
  ['code','numbers = [1, 2, 3]\nprint(numbers[3])'],
  ['p','Pybench explains every error in plain words below the traceback. To handle an error yourself, wrap the risky line in `try`.'],
  ['code','try:\n    n = int("seven")\nexcept ValueError:\n    print("That was not a number")']],
  task:{ text:'Write `safe_divide(a, b)` that returns a / b, but returns `None` when b is zero (use try/except ZeroDivisionError).',
    starter:'def safe_divide(a, b):\n    \n',
    check:`assert safe_divide(10, 4) == 2.5, "safe_divide(10, 4) should be 2.5."
assert safe_divide(1, 0) is None, "safe_divide(1, 0) should return None."
assert "except" in SOURCE, "Use try and except."`,
    hint:'try:  return a / b   except ZeroDivisionError:  return None' } },

{ id:'files', title:'Files',
  body:[
  ['p','`open(name, "w")` writes a file, `"r"` reads it, `"a"` adds to the end. `with` closes the file for you. Files you create show up in the Files panel.'],
  ['code','with open("notes.txt", "w") as f:\n    f.write("first line\\n")\n    f.write("second line\\n")\n\nwith open("notes.txt") as f:\n    for line in f:\n        print(line.strip())']],
  task:{ text:'Write the numbers 1 to 5 to `numbers.txt`, one per line, then read the file back and print the sum of the numbers (15).',
    starter:'',
    check:`import os
assert os.path.exists("numbers.txt"), "Create a file called numbers.txt."
assert open("numbers.txt").read().split() == ["1","2","3","4","5"], "numbers.txt should hold 1 to 5, one per line."
assert "15" in OUTPUT, "Print the sum (15)."`,
    hint:'f.write(f"{n}\\n") in a loop; then sum(int(line) for line in open("numbers.txt"))' } },

{ id:'comps', title:'Comprehensions',
  body:[
  ['p','A list comprehension builds a list in one line: what to keep, a for, and an optional if.'],
  ['code','squares = [n * n for n in range(6)]\nevens = [n for n in range(20) if n % 2 == 0]\nprint(squares, evens)'],
  ['p','The same works for dictionaries and sets: `{w: len(w) for w in words}`.']],
  task:{ text:'Make `lengths`, a list of the lengths of the words in `words`, using a comprehension.',
    starter:'words = ["sun", "moon", "comet", "sky"]\n',
    check:`assert lengths == [3, 4, 5, 3], f"lengths should be [3, 4, 5, 3], got {lengths!r}"
assert "for" in SOURCE and "[" in SOURCE, "Use a list comprehension."`,
    hint:'lengths = [len(w) for w in words]' } },

{ id:'classes', title:'Classes',
  body:[
  ['p','A class is a blueprint for objects that carry their own data (attributes) and actions (methods). `__init__` runs when an object is made; `self` is the object itself.'],
  ['code','class Dog:\n    def __init__(self, name):\n        self.name = name\n        self.tricks = []\n\n    def learn(self, trick):\n        self.tricks.append(trick)\n\nrex = Dog("Rex")\nrex.learn("sit")\nprint(rex.name, rex.tricks)'],
  ['p','Open Window > Module browser (Alt+C) to see the classes and functions in a file.']],
  task:{ text:'Write a class `Counter` with a method `click()` that adds 1 to `self.count` (starting at 0) and a method `reset()` that sets it back to 0.',
    starter:'class Counter:\n    def __init__(self):\n        \n',
    check:`c = Counter()
assert getattr(c, "count", None) == 0, "A new Counter should have count 0 (set self.count = 0 in __init__)."
c.click(); c.click()
assert c.count == 2, "After two clicks count should be 2."
c.reset()
assert c.count == 0, "reset() should set count to 0."`,
    hint:'def click(self):  self.count += 1' } },

{ id:'turtle', title:'Drawing with turtle',
  body:[
  ['p','The turtle module draws: a pen moves forward and turns. Results appear in the Turtle panel.'],
  ['code','import turtle\nt = turtle.Turtle()\nfor _ in range(4):\n    t.forward(100)\n    t.left(90)'],
  ['p','Try `t.color("red")`, `t.circle(50)`, `t.penup()`, `t.goto(x, y)`, `t.begin_fill()` and `t.end_fill()`. Help > Turtle demos has more.']],
  task:{ text:'Draw a triangle with sides of 120 (three forwards and three left turns of 120 degrees). The turtle should finish back where it started.',
    starter:'import turtle\nt = turtle.Turtle()\n',
    check:`import turtle as _t
_me = [v for v in list(globals().values()) if isinstance(v, _t.Turtle)] or ([_t._default[0]] if _t._default[0] else [])
assert _me, "Make a turtle and move it."
_x, _y = _me[0].position()
assert abs(_x) < 0.5 and abs(_y) < 0.5, f"The turtle should end where it started, it is at ({_x:.0f}, {_y:.0f})."
assert SOURCE.count("120") >= 2 or "range(3)" in SOURCE, "Use sides of 120 and turns of 120."`,
    hint:'for _ in range(3):  t.forward(120);  t.left(120)' } },

{ id:'debug', title:'Using the debugger',
  body:[
  ['p','The debugger runs your program one line at a time so you can watch variables change. Turn it on with Debug > Debugger, then press F5.'],
  ['p','Step goes into the next line (and into functions). Over runs a whole function call as one step. Out finishes the current function. Go runs until the next breakpoint. Click the gutter left of a line number to set a breakpoint.'],
  ['code','def factorial(n):\n    result = 1\n    for k in range(2, n + 1):\n        result *= k\n    return result\n\nprint(factorial(5))']],
  task:{ text:'This one is a puzzle: fix `average` so it returns the true average. Use the debugger to watch `total` if you get stuck.',
    starter:'def average(nums):\n    total = 0\n    for n in nums:\n        total = n\n    return total / len(nums)\n\nprint(average([2, 4, 9]))\n',
    check:`assert average([2, 4, 9]) == 5, f"average([2, 4, 9]) should be 5, got {average([2, 4, 9])!r}."
assert average([10]) == 10, "average([10]) should be 10."`,
    hint:'total = n replaces the total each time. It should add: total += n' } },
];

PB.cheats = [
 ['Output and input', ['print("text", value)', 'print(a, b, sep=", ", end="")', 'name = input("Prompt: ")', 'n = int(input()); x = float(input())', 'print(f"{name} is {age} years old")', 'print(f"{pi:.3f}")']],
 ['Types', ['type(x)', 'int("5"), float("2.5"), str(10), bool(0)', 'list("abc"), tuple(x), set(x), dict(a=1)', 'isinstance(x, int)']],
 ['Strings', ['s.upper(), s.lower(), s.title()', 's.strip(), s.split(","), ",".join(parts)', 's.replace("a", "b"), s.find("x"), s.count("x")', 's[0], s[-1], s[1:4], s[::-1]', 'len(s), "x" in s']],
 ['Lists', ['xs = [1, 2, 3]', 'xs.append(4); xs.insert(0, 0); xs.pop()', 'xs.remove(2); xs.index(3); xs.sort()', 'sorted(xs, reverse=True)', 'sum(xs), max(xs), min(xs), len(xs)', '[n * 2 for n in xs if n > 1]']],
 ['Dictionaries', ['d = {"a": 1, "b": 2}', 'd["c"] = 3; del d["a"]', 'd.get("z", 0)', 'for k, v in d.items():\n    print(k, v)', '{k: v for k, v in pairs}']],
 ['Control flow', ['if x > 0:\n    ...\nelif x == 0:\n    ...\nelse:\n    ...', 'for i in range(10):\n    ...', 'for i, item in enumerate(xs):\n    ...', 'while running:\n    ...', 'break / continue / pass']],
 ['Functions', ['def add(a, b=0):\n    return a + b', 'def total(*nums):\n    return sum(nums)', 'square = lambda x: x * x', 'def f(**opts): ...']],
 ['Errors', ['try:\n    risky()\nexcept ValueError as e:\n    print(e)\nfinally:\n    tidy()', 'raise ValueError("bad value")', 'assert x > 0, "x must be positive"']],
 ['Files', ['with open("f.txt", "w") as f:\n    f.write("hi\\n")', 'with open("f.txt") as f:\n    for line in f:\n        print(line.strip())', 'text = open("f.txt").read()']],
 ['Classes', ['class Point:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\n    def __repr__(self):\n        return f"Point({self.x}, {self.y})"', 'class Dog(Animal):\n    def speak(self):\n        return "Woof"']],
 ['Handy modules', ['import random\nrandom.randint(1, 6)\nrandom.choice(xs)', 'import math\nmath.sqrt(2), math.pi, math.floor(x)', 'import time\ntime.sleep(0.5)', 'from datetime import date\ndate.today()', 'import json\njson.dumps(d), json.loads(s)']],
 ['Shell tricks', ['_          # the last result', 'help(len)  # documentation', 'dir(obj)   # what it can do', 'Alt+P / Alt+N  # previous / next']],
];

PB.examples = [
 ['Turtle: spiral', `import turtle
t = turtle.Turtle()
t.speed(0)
colors = ["#c2410c", "#2d5a52", "#9a5200", "#2f4373"]
for i in range(120):
    t.pencolor(colors[i % 4])
    t.forward(i * 3)
    t.left(91)
`],
 ['Turtle: star', `import turtle
t = turtle.Turtle()
t.color("#9a5200", "#e9b44c")
t.begin_fill()
for _ in range(5):
    t.forward(200)
    t.right(144)
t.end_fill()
t.hideturtle()
`],
 ['Turtle: tree', `import turtle
t = turtle.Turtle()
t.speed(0)
t.left(90)
t.penup(); t.goto(0, -200); t.pendown()

def branch(length, depth):
    if depth == 0:
        return
    t.pensize(depth)
    t.forward(length)
    t.left(25)
    branch(length * 0.72, depth - 1)
    t.right(50)
    branch(length * 0.72, depth - 1)
    t.left(25)
    t.backward(length)

t.pencolor("#4d3a22")
branch(110, 8)
`],
 ['Turtle: flower', `import turtle
t = turtle.Turtle()
t.speed(0)
t.pencolor("#c2410c")
for _ in range(36):
    t.circle(90)
    t.left(10)
t.hideturtle()
`],
 ['Guess the number', `import random

secret = random.randint(1, 50)
tries = 0
while True:
    guess = int(input("Guess (1-50): "))
    tries += 1
    if guess < secret:
        print("Higher")
    elif guess > secret:
        print("Lower")
    else:
        print(f"Got it in {tries} tries!")
        break
`],
 ['FizzBuzz', `for n in range(1, 31):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)
`],
 ['Times table quiz', `import random

score = 0
for _ in range(5):
    a, b = random.randint(2, 12), random.randint(2, 12)
    answer = input(f"{a} x {b} = ")
    if answer.strip() == str(a * b):
        score += 1
        print("Right")
    else:
        print("It is", a * b)
print(f"Score: {score}/5")
`],
];
