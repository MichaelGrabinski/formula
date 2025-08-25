import random

from django.conf import settings
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _


def environment_callback(request):
    if settings.DEBUG:
        return [_("Development"), "primary"]

    return [_("Production"), "primary"]


def badge_callback(request):
    return f"{random.randint(1, 9)}"


def permission_callback(request):
    return True


def driver_link_callback(request):
    return (
        lambda request: str(reverse_lazy("admin:formula_driver_changelist"))
        in request.path
        or request.path == reverse_lazy("admin:formula_driverwithfilters_changelist")
        or request.path == reverse_lazy("admin:crispy_form")
        or request.path == reverse_lazy("admin:crispy_formset")
    )


def driver_list_link_callback(request):
    if request.path == reverse_lazy("admin:formula_driver_changelist"):
        return True

    if str(reverse_lazy("admin:formula_driver_changelist")) in request.path:
        return True

    if str(reverse_lazy("admin:formula_driverwithfilters_changelist")) in request.path:
        return True

    return False


def driver_list_sublink_callback(request):
    if str(reverse_lazy("admin:crispy_form")) in request.path:
        return False

    if str(reverse_lazy("admin:crispy_formset")) in request.path:
        return False

    if request.path == reverse_lazy("admin:formula_driver_changelist"):
        return True

    if str(reverse_lazy("admin:formula_driver_changelist")) in request.path:
        return True

    return False


# assignments/utils/prompt_router.py
from dataclasses import dataclass
from typing import Callable, List

@dataclass
class Step:
    name: str
    prompt_fn: Callable[[str], str]


# assignments/utils/prompt_builder.py
from textwrap import indent
from .prompts import PROMPT_TEMPLATE, FORCE_IMPERFECT, FEW_SHOTS
from .style import STYLE_GUIDE
from .rubrics import RUBRICS

def build_rubric_block(task: str) -> str:
    rb = RUBRICS.get(task, {})
    # render as "• <label>: <requirement>"
    lines = [f"• {k}: {v}" for k, v in rb.items()]
    return "\n".join(lines)

def first_pass_prompt(task: str, submission_text: str) -> str:
    return PROMPT_TEMPLATE.format(
        style=STYLE_GUIDE,
        rubric_block=build_rubric_block(task),
        text=submission_text,
        few_shots=FEW_SHOTS,
    )

def second_pass_prompt(prev_output_text: str) -> str:
    return FORCE_IMPERFECT + "\n\n--- PRIOR EVALUATION ---\n" + prev_output_text


# assignments/utils/task_match.py
from .rubrics import RUBRICS

def detect_task_from_title(title: str) -> str:
    if not title:
        return ""
    t = title.lower()
    # simple contains match
    for task in RUBRICS.keys():
        if task.lower() in t:
            return task
    return ""  # caller can decide default/fallback


# assignments/services/openai_client.py
import os
from typing import Dict, Any, List
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _comment_schema():
    return {
        "type": "json_schema",
        "json_schema": {
            "name": "rubric_comments",
            "schema": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string"},
                                "comment": {"type": "string"}
                            },
                            "required": ["label", "comment"],
                            "additionalProperties": False
                        },
                        "minItems": 1
                    },
                    "needs_improvement": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 2
                    },
                    "synthesis": {"type": "string"}
                },
                "required": ["items", "synthesis"],
                "additionalProperties": False
            }
        }
    }

def run_o3_structured(system: str, prompt: str, max_out: int = 2000) -> Dict[str, Any]:
    resp = client.responses.create(
        model="o3",
        input=[{"role": "system", "content": system},
               {"role": "user", "content": prompt}],
        response_format=_comment_schema(),
        temperature=0.2,
        max_output_tokens=max_out,
    )
    # SDKs commonly expose parsed structured output; fall back to output_text->json if needed
    parsed = getattr(resp, "parsed", None)
    if parsed is None:
        import json
        parsed = json.loads(resp.output_text)
    return {"parsed": parsed, "raw": resp}


# assignments/utils/sanitize.py
import re

BANNED_PHRASES = [
    r"\bthus meeting the requirements\b",
    r"\bmet requirements\b",
    r"\bmeets the rubric\b",
    r"\btherefore\b",
]
CODES = r"\b(?:D\d{2,4}|[ABCDEF]\d{1,2}|C\d{1,2})\b"

def sanitize_sentence(s: str) -> str:
    s = re.sub(CODES, "", s, flags=re.IGNORECASE).strip()
    for pat in BANNED_PHRASES:
        s = re.sub(pat, "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s{2,}", " ", s).strip()
    if not s.lower().startswith("the submission"):
        if s:
            s = "The submission " + s[0].lower() + s[1:]
        else:
            s = "The submission"
    parts = re.split(r"(?<=[.!?])\s+", s)
    if len(parts) > 2:
        s = " ".join(parts[:2]).strip()
    return s

def sanitize_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        return payload
    items = payload.get("items", [])
    payload["items"] = [
        {
            "label": it.get("label"),
            "comment": sanitize_sentence(it.get("comment", "") or "")
        }
        for it in items
    ]
    # synthesis: keep positive & short-ish (3 sentences expected; don't enforce here)
    syn = payload.get("synthesis", "").strip()
    if syn and not syn.startswith("You"):
        # Capitalize / enforce "You" start
        syn = "You" + syn[1:] if syn else "You "
    payload["synthesis"] = syn
    return payload


# assignments/utils/prompts.py
from textwrap import dedent
from .style import STYLE_GUIDE

FEW_SHOTS = dedent(r"""
EXAMPLES (bad → good)
Bad: "The submission for C4 provides X and Y, thus meeting the requirements."
Good: "The submission provides X and Y with clear evidence in sections 2–3."

Bad: "The submission meets the rubric because it covers Z."
Good: "The submission explains Z with sufficient detail, but omits supporting sources."

Bad: "Therefore, the submission met requirements for analysis."
Good: "The submission analyzes the issue and evaluates alternatives; add one counterexample."
""")

PROMPT_TEMPLATE = """
{style}

EVALUATION INSTRUCTIONS
• Evaluate and synthesize the content based on each rubric section.
• Every comment must start with "The submission".
• Do not mention rubric codes (e.g., A1, B2, C4) in the text of comments.
• Assume any referenced screenshots, code snippets, or images are present.
• Keep 1–2 sentences per item.
• After all items, produce a 3-sentence positive synthesis that begins with "You".

RUBRIC (labels → requirement)
{rubric_block}

SUBMISSION
---
{text}
---

{few_shots}
"""

FORCE_IMPERFECT = """
Now revise your evaluation so that at least 2–3 rubric items are marked as needing improvement,
even if the submission appears strong. Choose fairly and give constructive, actionable notes.

Retain the same style rules:
- Start each item with "The submission"
- Do not mention codes
- Avoid meta-phrases like "thus meeting the requirements"
- Keep 1–2 sentences per item
- End with a 3-sentence positive synthesis beginning with "You"
"""


# assignments/utils/style.py
STYLE_GUIDE = """
You are an academic reviewer.

WRITING RULES
1) Start every comment with: "The submission".
2) Never mention internal codes or labels in the text (e.g., D150, C1–C9, A1, B2).
3) Do not write meta-phrases like “thus meeting the requirements”, “met requirements”,
   “therefore it meets”, “requirements met”, or “meets the rubric”. These are implied.
4) Keep tone neutral, precise, and specific. Avoid cheerleading or judgments.
5) Each rubric item gets 1–2 sentences, grounded in the submission.
6) No preambles or conclusions around the list—return only the evaluation items and the final synthesis.
7) After all items, add a 3-sentence positive synthesis that starts with "You".
"""




# assignments/utils/rubrics.py
RUBRICS = {
    "NIP TASK 1": {
        "Explain the functionalities of the chatbot": "Does the submission explain the functionalities of the chatbot and how they will meet the needs described in the scenario?",
        "Identify five computing job": "Does the submission describe five computing jobs?",
        "Explain how the chatbot training cases": "Does the submission explain how the chatbot training cases were selected and how they used artificial intelligence markup language (AIML) to enhance the functionality of the chatbot. Do they also provide examples of the chatbot's functionality that represent the selected cases at the end of the training process in support of your explanation?",
        "Assess the strengths and weaknesses of the chatbot": "Does the submission assess the strengths and weaknesses of the chatbot development environment and explain how they supported or impeded the construction of the chatbot?",
        "Explain how the chatbot will be monitored": "Does the submission explain how the chatbot will be monitored and maintained to improve the final user experience?",
    },

    "NIP TASK 2": {
        "Describe the disaster recovery, A": "Does the text describe the disaster recovery environment you chose and the two obstacles you have added to the environment?",
        "Explain how the robot will improve, B": "Does the submission explain how the robot will improve disaster recovery in the environment from part A after you have added the two obstacles from part A?",
        "Justify the modifications, C": "Does the submission justify the modifications you made to CoppeliaSim's robot architecture, including two sensors you chose to add, and explain how these sensors will aid the disaster recovery effort?",
        "Describe how the robot maintains, D": "Does the submission describe how the robot maintains an internal representation of the environment?",
        "Explain how the robot implements, E": "Does the submission explain how the robot implements the following four concepts to achieve its goal: reasoning, knowledge representation, uncertainty, intelligence?",
        "Explain how the prototype, F": "Does the submission explain how the prototype could be further improved, including how reinforcement learning and advanced search algorithms can improve the prototype's performance and learning?",
    },

    "NIP TASK 3": {
        "Organizational Need, A1": "Does the submission describe an organizational need that your project proposes to solve?",
        "Context and Background, A2": "Does the submission describe the context and background for your project?",
        "Outside Works, A3": "Does the submission review three outside works that explore machine learning solutions that apply to the need described?",
        "Solution Summary, A4": "Does the submission summarize the proposed machine learning solution and also state the algorithm used?",
        "Machine Learning Benefits, A5": "Does the submission describe the benefits of the proposed machine learning solution?",
        "Scope of the, B1": "Does the submission define the scope of the proposed machine learning project and include at least three in-scope and one out-of-scope item?",
        "Goals, Objectives, and Deliverables, B2": "Does the submission explain the goals, objectives, and deliverables for the proposed project?",
        "Standard Methodology": "Does the submission mention a methodology for the project and, with plenty of detail, break it down step by step?",
        "Resources and Costs": "Does the submission provide a list of at least one type of hardware, software, and labor cost in the project? If so, say, 'The submission clearly defines the cost and description of the resources needed.' If it does not state any of the resources, state what it does provide and what is missing.",
        "Evaluation Criteria": "Does the submission describe the criteria that you will use to evaluate the success of the project once it is completed and uses a specific criteria?",
        "C1": "Is this a valid hypothesis?",
        "C2": "Does the submission identify the machine learning algorithm(s) and does it state whether it's supervised, unsupervised, or reinforcement learning?",
        "Performance Measurement": "Does the submission explain the process you will use to measure the performance of your proposed machine learning solution?",
    },

    "NBM3 Task 1": {
        "A1": "Using the text above, does the submission summarize one research question relevant to a real-world organizational situation captured in the selected data set that the submission will answer using multiple regression? Explain why or why not in two sentences:",
        "A2": "Using the text above, does the submission define the objectives or goals of the data analysis? Ensure the objectives/goals are reasonable within scope and represented in available data. Explain why or why not in two sentences:",
        "B1": "Using the text above, does the submission summarize some assumptions of a multiple regression model? Explain why or why not in two sentences:",
        "B2": "Using the text above, does the submission describe benefits of using the chosen tool(s) (Python, R, SAS, etc.) across phases of the analysis? Explain why or why not in two sentences:",
        "B3": "Using the text above, does the submission explain why multiple regression is appropriate for the selected research question? Explain why or why not in two sentences:",
        "C1": "Using the text above, does the submission describe data preparation goals and the manipulations to achieve them? Explain why or why not in two sentences:",
        "C2": "Using the text above, does the submission discuss summary statistics for the target and predictor variables needed to answer the research question? Explain why or why not in two sentences:",
        "C4": "Using the text above, does the submission explain steps used to prepare the data for analysis, including annotated code? Explain why or why not in two sentences:",
        "D1": "Using the text above, does the submission construct an initial multiple regression model from all predictors identified in C2? Explain why or why not in two sentences:",
        "D2": "Using the text above, does the submission justify a statistically based variable selection procedure and evaluation metric to reduce the initial model in alignment with the research question? Explain why or why not in two sentences:",
        "D3": "Using the text above, does the submission provide a reduced multiple regression model including categorical and continuous variables? Explain why or why not in two sentences:",
        "F1": "Using the text above, does the submission discuss results including: regression equation for the reduced model, interpretation of >1 significant coefficient, statistical & practical significance relative to the research question, and dataset limitations (population inferences)? Explain why or why not in two sentences:",
        "F2": "Using the text above, does the submission recommend a course of action based on results? Explain why or why not in two sentences:",
    },

    "NBM3 Task 2": {
        "A1": "Using the text above, does the submission include 1 research question relevant to a realistic organizational situation that can be addressed with logistic regression? Explain why or why not in two sentences:",
        "A2": "Using the text above, does the submission define objectives/goals of the data analysis? Explain why or why not in two sentences:",
        "B1": "Using the text above, does the submission summarize assumptions of a logistic regression model? Explain why or why not in two sentences:",
        "B2": "Using the text above, does the submission describe benefits of the chosen tool(s) (Python, R, SAS, etc.) across the analysis? Explain why or why not in two sentences:",
        "B3": "Using the text above, does the submission explain why logistic regression is appropriate for the selected question? Explain why or why not in two sentences:",
        "C1": "Using the text above, does the submission describe data preparation goals and manipulations? Explain why or why not in two sentences:",
        "C2": "Using the text above, does the submission discuss summary statistics (target and predictors) needed to answer the question? Explain why or why not in two sentences:",
        "C4": "Using the text above, does the submission explain steps used to prepare data, including annotated code? Explain why or why not in two sentences:",
        "D1": "Using the text above, does the submission construct an initial logistic regression model from all predictors identified in C2? Explain why or why not in two sentences:",
        "D2": "Using the text above, does the submission justify a statistically based variable selection procedure and evaluation metric to reduce the model in alignment with the research question? Explain why or why not in two sentences:",
        "D3": "Using the text above, does the submission provide a reduced logistic regression model including categorical and continuous variables? Explain why or why not in two sentences:",
        "F1": "Using the text above, does the submission discuss results of the data analysis, addressing all given elements in alignment with the question and the analysis?",
        "F2": "Using the text above, does the submission recommend a course of action based on results? Explain why or why not in two sentences:",
    },

    "NAM2 Task 1": {
        "A01": "Using the text above, does the submission provide a functional and complete dashboard using 1 provided dataset and 1 additional external public dataset? Explain why or why not in two sentences:",
        "A1": "Using the text above, does the submission provide both datasets that serve as the data source for the dashboard? Explain why or why not in two sentences:",
        "C1": "Using the text above, does the submission explain alignment between dashboard purpose/function and needs in the data dictionary? If so, say how in two sentences:",
        "C2": "Using the text above, does the submission explain how variables in the additional dataset enhance insights from the provided dataset? If so, say how in two sentences:",
        "C3": "Using the text above, does the submission explain how two different dashboard representations support executive decisions? If so, say how in two sentences:",
        "C4": "Using the text above, does the submission explain how two interactive controls enable users to modify the dashboard? If so, say how in two sentences:",
        "C5": "Using the text above, does the submission describe how the dashboard was built for colorblind accessibility? If so, say how in two sentences:",
        "C6": "Using the text above, does the submission explain how 2 data representations in the presentation support the story, with plausible reasons? If so, say how in two sentences:",
        "C7": "Using the text above, does the submission explain how audience analysis adapted the message, with specific examples? If so, say how in two sentences:",
        "C8": "Using the text above, does the submission describe how the presentation was designed for universal access? If so, say how in two sentences:",
    },

    "NUM3 Task 1": {
        "A1": "Using the text above, does the submission summarize a question/decision addressable via the chosen dataset using all variables? If so, say how in two sentences:",
        "B1": "Using the text above, does the submission include all variables and indicate type for each, with examples from the data? If so, say how in two sentences:",
        "C1": "Using the text above, does the proposal detail techniques/steps for assessing data quality? If so, say how in two sentences:",
        "C2": "Using the text above, does the submission justify the approach to assess data quality aligned with the dataset? If so, say how in two sentences:",
        "C3": "Using the text above, does the submission describe benefits of the programming language and packages for cleaning, with examples? If so, say how in two sentences:",
        "D1": "Using the text above, does the description accurately include all data-quality issues found in part C? If so, say how in two sentences:",
        "D2": "Using the text above, does the submission include mitigation methods for all issues listed in D1? If so, say how in two sentences:",
        "D3": "Using the text above, does the summary detail outcomes of each cleaning step with plausible expectations? If so, say how in two sentences:",
        "D6": "Using the text above, does the submission summarize limitations of the cleaning process completely and accurately? If so, say how in two sentences:",
        "E1": "Using the text above, does the submission identify total number of principal components and provide correct loading matrix output? If so, say how in two sentences:",
        "E3": "Using the text above, does the submission describe how the organization benefits from PCA logically and accurately? If so, say how in two sentences:",
    },

    "OEM2 Task 1": {
        "A1": "Provide a question addressed via descriptive stats (χ2, t-test, or ANOVA) on the chosen dataset; is it relevant? Explain why or why not in two sentences:",
        "A2": "Explain how stakeholders will benefit from the analysis. Two sentences:",
        "A3": "Identify specific data relevant to A1. Two sentences:",
        "B2": "Include output/results of all calculations. Two sentences:",
        "B3": "Justify the chosen technique (one of χ2, t-test, ANOVA) as sufficient/appropriate for A1/dataset. Two sentences:",
        "E1": "Discuss accurate and complete results of the hypothesis test. Two sentences:",
        "E2": "Explain limitations of the analysis (no irrelevant limitations). Two sentences:",
        "E3": "Recommend actions in response to A1 with plausible steps. Two sentences:",
    },

    "NVM2 Task 1": {
        "A1": "Propose a question relevant to a real-world situation including a given classification method. Two sentences:",
        "A2": "Define a reasonable analysis goal within scope and represented in data. Two sentences:",
        "B1": "Explain how the chosen classification method analyzes the dataset and expected outcomes. Two sentences:",
        "B2": "Summarize one assumption of the chosen classification method. Two sentences:",
        "B3": "List packages/libraries for Python/R and justify each for the analysis. Two sentences:",
        "C1": "Describe one preprocessing goal relevant to the classification method. Two sentences:",
        "C2": "Identify dataset variables needed for A1 and classify as continuous/categorical. Two sentences:",
        "C3": "Explain each data-prep step and provide an accurate code segment for each. Two sentences:",
        "E1": "Explain both accuracy and AUC for the classification model. Two sentences:",
        "E3": "Discuss one limitation of the analysis with adequate detail. Two sentences:",
        "E4": "Recommend a reasonable course of action based on results and implications. Two sentences:",
    },

    "NVM2 Task 2": {
        "A1": "Propose a question relevant to a real-world situation including a given prediction method. Two sentences:",
        "A2": "Define a reasonable analysis goal within scope and represented in data. Two sentences:",
        "B1": "Explain how the chosen prediction method analyzes the dataset and expected outcomes. Two sentences:",
        "B2": "Summarize one assumption of the chosen prediction method. Two sentences:",
        "B3": "List packages/libraries for Python/R and justify each for the analysis. Two sentences:",
        "C1": "Describe one preprocessing goal relevant to the prediction method. Two sentences:",
        "C2": "Identify dataset variables for A1 and classify as continuous/categorical. Two sentences:",
        "C3": "Explain each data-prep step and provide an accurate code segment for each. Two sentences:",
        "D1": "Provide reasonable train/test split. Two sentences:",
        "E1": "Explain both accuracy and mean squared error (MSE) of the prediction model. Two sentences:",
        "E2": "Discuss both results and implications of the prediction analysis. Two sentences:",
        "E4": "Recommend a reasonable course of action based on E2. Two sentences:",
    },

    "SLM2 Task 1": {
        "A2": "Provide both datasets that are accurate, complete, and support exec dashboards. Two sentences:",
        "A4": "Provide all SQL/other supporting code accurately and completely. Two sentences:",
        "B0": "The link connects to the Panopto multimedia presentation.",
        "B1": "The technical environment description is complete and accurate.",
        "B2": "The submission fully demonstrates dashboard functionality.",
        "B3": "Explanation of SQL scripts for dashboards is accurate and complete.",
        "B4": "Explanation of data stream preparation is accurate, complete, and logical.",
        "B5": "Description of data alignment with other data points is accurate, logical, complete.",
        "B6": "Demonstration of database creation is accurate and complete.",
        "B7": "Explanation of enforced referential integrity is accurate and complete.",
        "C1": "Explain alignment between dashboard purpose/function and needs in the data dictionary. Two sentences:",
        "C2": "Justify the selected BI tool accurately and completely. Two sentences:",
        "C3": "Explain steps used to clean/prepare data accurately and completely. Two sentences:",
        "C4": "Summarize steps to create the dashboards accurately and completely. Two sentences:",
        "C5": "Discuss how analysis results support executive decision-making accurately and completely. Two sentences:",
        "C6": "Discuss limitation(s) of the analysis accurately and completely. Two sentences:",
    },

    "NLM2 Task 1": {
        "A1": "Summarize one research question for time series modeling. Two sentences:",
        "A2": "Define objectives/goals that are reasonable within scope and represented in data. Two sentences:",
        "B1": "Summarize assumptions of a time series model (stationarity, serial correlation). Two sentences:",
        "C1": "Provide a labeled line graph showing the realization of the time series. Two sentences:",
        "C2": "Describe time step formatting, gaps, and length. Two sentences:",
        "C3": "Evaluate stationarity aligned to dataset and research question. Two sentences:",
        "C4": "Explain data-prep steps including train/test split for TS modeling. Two sentences:",
        "D1": "Report annotated findings with visualizations addressing all six listed elements. Two sentences:",
        "D2": "Identify an ARIMA model that accounts for observed trend/seasonality and is appropriate. Two sentences:",
        "D3": "Perform a forecast using the ARIMA model; is it accurate? Two sentences:",
        "E1": "Discuss results including all points in alignment with question and analysis. Two sentences:",
        "E3": "Recommend an appropriate course of action based on results. Two sentences:",
    },

    "NLM2 Task 2": {
        "A1": "Summarize a research question answered by neural networks + NLP. Two sentences:",
        "A2": "Define objectives/goals reasonable within scope and data. Two sentences:",
        "A3": "Identify an industry-relevant NN type for useful text classification on the dataset. Two sentences:",
        "B1": "Perform EDA including unusual chars, vocab size, embedding length, and sequence length justification. Two sentences:",
        "B2": "Describe tokenization goals, code, and packages used to normalize text. Two sentences:",
        "B3": "Explain padding process, where it occurs, and include a screenshot of one padded sequence. Two sentences:",
        "B4": "Identify # of sentiment categories and choose a fitting activation for final Dense layer. Two sentences:",
        "C1": "Provide output of `model.summary()` aligned with the network type. Two sentences:",
        "C2": "Discuss #layers, layer types, and total parameters. Two sentences:",
        "C3": "Justify hyperparameters across listed points, aligned with network. Two sentences:",
        "D1": "Discuss impact of early stopping vs. fixed epochs and include a screenshot of final training epoch. Two sentences:",
        "D2": "Assess fitness and measures against overfitting. Two sentences:",
        "D3": "Provide training process visualizations (loss + chosen metric), properly labeled. Two sentences:",
        "D4": "Discuss predictive accuracy of the trained model. Two sentences:",
        "F1": "Discuss functionality of the NN and impact of architecture, aligned with the research question. Two sentences:",
    },

    "OTN1 Task 1": {
        "A": "Is the description of what was learned based on the self-assessment results and does it address each point? Two sentences:",
        "A1": "Provide evidence of completion of the self-assessment (e.g., screenshot). Two sentences:",
        "B1": "Is a SMART goal identified? Two sentences:",
        "B2": "Does the explanation address how the SMART goal supports leadership development? Two sentences:",
        "B3": "Does the explanation address how strengths from the self-assessment will help achieve the SMART goal? Two sentences:",
    },

    "OTN2 Task 1": {
        "A": "Explain categorical strengths and how they relate to leadership. Two sentences:",
        "A1": "Comprehensively discuss the 5 categorical strengths from CliftonStrengths. Two sentences:",
        "B": "Identify a specific goal relevant to the scenario that addresses leadership development. Two sentences:",
        "B1": "Provide two specific actions that support the goal and show understanding of the leadership role. Two sentences:",
        "C": "Recommend effective leadership strategies for each of two selected issues and how they address each issue. Two sentences:",
        "C1": "Explain how the strategies will motivate the team with approaches demonstrating understanding of the team's needs. Two sentences:",
    },

    "OTN1 Task 2": {
        "A1": "Explain meeting outcomes aligned with the recording and address: adherence to agenda, conflicts that emerged, and responses to conflicts. Two sentences:",
        "B1": "Evaluate effectiveness of communication strategies (influence on outcomes; how some hindered decision-making). Two sentences:",
        "C1": "Analyze the informal leader and approach to leadership (a skill shown, why you identified that leader, how they maintain focus). Two sentences:",
        "D1": "Explain overall team dynamics, including how each member contributed to outcomes. Two sentences:",
        "E1": "Plan a follow-up meeting to prioritize one team (attendees, questions, goals/expectations, facilitation to consensus). Two sentences:",
        "E2": "Justify the follow-up meeting to facilitate agreement on prioritizing one of the two teams. Two sentences:",
    },

    "OTN2 Task 2": {
        "A1": "Illustrate two examples of effective communication from the meeting video or implementation email. Two sentences:",
        "B1": "Identify two opportunities for improvement in communication from either the meeting video or the implementation email. Two sentences:",
        "C1": "Discuss two communication improvements the team leader would make in the meeting video or implementation email. Two sentences:",
        "D1": "Describe two different methods to communicate each improvement from part C1 to the team, including reasoning for each method. Two sentences:",
    },

    "TGM2 Task 1": {
        "A": "Provide a question that requires SQL from the original DB + add-on CSV table. Two sentences:",
        "A1": "Identify data from both sources (tables, columns, types) needed to answer A. Two sentences:",
        "B": "Explain an ERD with m:n relationships and relational constraints. Two sentences:",
        "B1": "Create SQL code to build tables per ERD (include code). Two sentences:",
        "B2": "Load CSV data into the table created in B1 (include code). Two sentences:",
        "C": "Include SQL statement(s) that answer A (include code). Two sentences:",
        "D": "Identify refresh frequency for the add-on file to keep data relevant. Two sentences:",
        "D1": "Explain why the identified refresh period is relevant to business needs. Two sentences:",
    },

    "KAN1 Task 1": {
        "A": "Explain the status of each data governance cornerstone at Golden Maple Bank. Two sentences:",
        "B": "Identify data governance gaps relevant to the four cornerstones given the crisis/new loan line. Two sentences:",
        "B1": "Provide logical/relevant details on the origins of the gaps. Two sentences:",
        "C": "Explain how the bank can improve information/governance readiness for new loan products. Two sentences:",
        "C1": "Evaluate readiness to administer new programs based on origins of gaps. Two sentences:",
        "C2": "Explain relevance of existing standards/processes for reporting, compliance, data protection, security. Two sentences:",
        "C3": "Explain opportunities to apply best practices to current/envisioned governance elements for emergency readiness. Two sentences:",
        "D1": "Recommend 4 next steps from the 11 agenda items for the team meeting. Two sentences:",
        "D2": "Justify each recommended next step within the enterprise context. Two sentences:",
    },

    "IDK Task 1": {
        "A1": "Provide a specific question for analysis via one of the listed techniques; is it relevant to the dataset? Two sentences:",
        "A2": "Explain how stakeholders benefit from the analysis. Two sentences:",
        "A3": "Identify specific dataset elements relevant to A1. Two sentences:",
        "B2": "Include output and all calculation results. Two sentences:",
        "B3": "Justify why the chosen technique (from B1 list) is sufficient/appropriate for the dataset and A1. Two sentences:",
        "E1": "Discuss accurate and complete results of the hypothesis test. Two sentences:",
        "E2": "Explain limitations of the analysis without adding inapplicable ones. Two sentences:",
        "E3": "Recommend actions that address A1 with plausible steps. Two sentences:",
    },

    "MKN1 Task 2": {
        "A1": "Describe a business problem solvable with a database solution aligned to the scenario. Two sentences:",
        "A2": "Justify why a NoSQL database solves the problem. Two sentences:",
        "A3": "Identify an appropriate NoSQL database type for the problem. Two sentences:",
        "A4": "Explain how business data will be used within the solution. Two sentences:",
        "B": "Discuss how the design addresses scalability with scenario-aligned strategies. Two sentences:",
        "C": "Outline privacy and security measures for the design. Two sentences:",
        "D1": "Provide a script to create a DB instance (right query language) with a clear screenshot of script and instance. Two sentences:",
        "D2": "Provide a script to insert/map scenario JSON data with a screenshot showing data inserted/mapped. Two sentences:",
        "D3": "Provide scripts for 3 queries that help solve the problem with screenshots of successful execution. Two sentences:",
        "D4": "Apply optimization techniques to improve run time of each query in D3 and provide screenshot results. Two sentences:",
        "E1": "Presentation walk-through meets professional standards and suits a technical project team. Two sentences:",
        "E2": "Presentation thoroughly/accurately demonstrates all requirements and a functioning DB solution. Two sentences:",
    },

    "MKN1 Task 1": {
        "A1": "Describe a business problem solvable with a database solution aligned to the scenario. Two sentences:",
        "A2": "Propose a data structure appropriate for the problem. Two sentences:",
        "A3": "Justify why a database solution will solve the problem. Two sentences:",
        "A4": "Explain how business data will be used within the solution. Two sentences:",
        "B": "Provide a logical data model for storing data, aligned with the designed solution. Two sentences:",
        "C": "Describe the database objects and storage, identifying file attributes. Two sentences:",
        "D": "Discuss how the design addresses scalability with scenario-aligned strategies. Two sentences:",
        "E": "Outline privacy and security measures to implement. Two sentences:",
        "F1": "Provide a script to create a DB instance per the logical model (with screenshot). Two sentences:",
        "F2": "Provide a script to insert/map CSV data (with screenshot). Two sentences:",
        "F3": "Provide scripts for 3 queries with screenshots of execution. Two sentences:",
        "F4": "Apply optimization to queries in F3 and provide output via screenshot. Two sentences:",
        "G1": "Presentation walk-through meets professional standards for a technical audience. Two sentences:",
        "G2": "Presentation demonstrates all requirements and a functioning solution. Two sentences:",
    },

    "QKN1 Task 2": {
        "A": "Provide a Python/R program that completes all required Task 1 analyses and is error-free (import, dedupe, group-by stats by state, negative D/E filter, create DTI, concat DTI with original). Two sentences:",
        "B": "Include in-text citations and references with consistent APA style. Two sentences:",
        "C": "Content is organized, focused, terminologically correct; mechanics support accurate interpretation. Two sentences:",
    },

    "UGN1 Task 3": {
        "A": "Project created in GitLab correctly; all actions completed. Two sentences:",
        "B1": "Propose 1 linear-analysis question relevant to a real-world situation. Two sentences:",
        "B2": "Define 1 reasonable analysis goal within scope and data. Two sentences:",
        "C1": "Explain how PCA prepares data for regression; identify expected outcomes. Two sentences:",
        "C2": "Summarize at least one PCA assumption. Two sentences:",
        "D1": "Identify continuous variables needed to answer B1. Two sentences:",
        "D2": "Provide a copy of cleaned data showing standardized continuous variables. Two sentences:",
        "D3": "Provide screenshots of descriptive stats for variables in D1. Two sentences:",
        "E1": "Determine the full principal-components matrix. Two sentences:",
        "E2": "Identify # of PCs retained using elbow or Kaiser, with a scree plot screenshot. Two sentences:",
        "E3": "Identify variance of each retained PC. Two sentences:",
        "E4": "Summarize PCA results logically. Two sentences:",
        "F1": "Provide reasonable train/test splits. Two sentences:",
        "F2": "Demonstrate model optimization (screenshot of summary or list of parameters). Two sentences:",
        "F3": "Provide training MSE of the optimized model. Two sentences:",
        "F4": "Provide prediction accuracy based on MSE. Two sentences:",
        "G1": "List packages/libraries for Python/R and justify each. Two sentences:",
        "G2": "Discuss the optimization method with justification. Two sentences:",
        "G3": "Discuss verification of assumptions used for the optimized model. Two sentences:",
        "G4": "Provide the regression equation and discuss coefficients logically. Two sentences:",
        "G5": "Discuss model metrics addressing each identified part. Two sentences:",
        "G6": "Discuss results and implications of the prediction analysis. Two sentences:",
        "G7": "Recommend a reasonable course of action based on G6. Two sentences:",
    },

    "UGN1 Task 1": {
        "A": "Project created in GitLab correctly; all actions completed. Two sentences:",
        "B1": "Propose 1 question answerable by linear analysis. Two sentences:",
        "B2": "Define 1 reasonable goal within scope/data. Two sentences:",
        "C1": "Identify DV and ≥2 IVs to answer the question; justify selections. Two sentences:",
        "C2": "Summarize at least one PCA assumption. Two sentences:",
        "C3": "Provide univariate & bivariate visualizations; DV included in all bivariates. Two sentences:",
        "D1": "Provide reasonable train/test splits. Two sentences:",
        "D2": "Demonstrate model optimization (screenshot summary or parameters). Two sentences:",
        "D3": "Provide training MSE of the optimized model. Two sentences:",
        "D4": "Provide prediction accuracy based on MSE. Two sentences:",
        "E1": "List packages/libraries for Python/R and justify each. Two sentences:",
        "E2": "Discuss the optimization method with justification. Two sentences:",
        "E3": "Discuss verification of assumptions used to create the optimized model. Two sentences:",
        "E4": "Provide the regression equation; discuss coefficients logically. Two sentences:",
        "E5": "Discuss model metrics addressing each identified part. Two sentences:",
    },

    "UGN1 Task 2": {
        "A": "Subgroup & project created in GitLab; all actions correct (competent performance).",
        "B1": "Propose 1 logistic-analysis question relevant to a real-world situation. Two sentences:",
        "B2": "Define 1 reasonable analysis goal within scope/data. Two sentences:",
        "C1": "Identify DV and ≥2 IVs with justification. Two sentences:",
        "C2": "Provide screenshots of descriptive statistics for all variables in C1.",
        "C3": "Provide univariate & bivariate visualizations for variables in C1; DV included in all bivariates.",
        "D1": "Provide reasonable train/test splits.",
        "D2": "Demonstrate model optimization (screenshot summary or list parameters).",
        "D3": "Provide confusion matrix and accuracy of the optimized model.",
        "D4": "Provide screenshot of predictions on test data using optimized model.",
        "E1": "List packages/libraries and justify each. Two sentences:",
        "E2": "Discuss the optimization method used. Two sentences:",
        "E3": "Justify the optimization approach. Two sentences:",
        "E4": "Summarize at least four assumptions of logistic regression. Two sentences:",
        "E5": "Submit a code snippet or screenshot verifying each assumption from E4. Two sentences:",
        "E6": "Provide the regression equation and discuss coefficients logically. Two sentences:",
    },

    "TCN Task 3": {
        "A1: Question for Analysis": "Using the text above, does the submission include a specific question relevant to the dataset and addressable via market basket analysis? Two sentences:",
        "A2: Data Analysis Goal": "Using the text above, does the submission define a clear goal for the market basket analysis within scope? Two sentences:",
        "B1: Market Basket Analysis": "Explain how market basket analysis will be applied and expected outcomes. Two sentences:",
        "B2: Transaction Example": "Provide a logical transaction example illustrating data usage. Two sentences:",
        "B3: Assumption Summary": "Summarize an assumption of market basket analysis. Two sentences:",
        "C1a: Categorical Variables": "Provide ≥2 ordinal and ≥2 nominal variables appropriate for further analysis. Two sentences:",
        "C1b: Encoding": "Encode variables suitably for market basket analysis. Two sentences:",
        "C1c: Transactionalize Data": "Correctly transactionalize data for market basket analysis. Two sentences:",
        "C1d: Explanation & Justification of Steps": "Explain and justify each transformation step. Two sentences:",
        "C2: Clean Dataset Copy": "Include a complete, correctly cleaned dataset copy with no errors. Two sentences:",
        "C3: Execute Code": "Include screenshot of executed, error-free code. Two sentences:",
        "C4: Support, Lift, Confidence": "Include screenshot with correct values for support, lift, confidence. Two sentences:",
        "C5: Relevant Rules": "Explain top 3 rules from Apriori with a screenshot. Two sentences:",
        "D1: Significance of Results Discussion": "Discuss significance and implications of findings. Two sentences:",
        "D2: Practical Significance Discussion": "Explain practical significance of findings. Two sentences:",
        "D3: Recommended Course of Action": "Provide a logical, accurate, complete recommendation based on results. Two sentences:",
        "E: Panopto Video": "Panopto video demonstrates functionality and summarizes tools used. Two sentences:",
        "F: Sources": "Include in-text citations and references, or state none were used, correctly. Two sentences:",
        "G: Professional Communication": "Content is organized, focused, and uses terminology correctly; mechanics support understanding. Two sentences:",
    },

    "TCN Task 2": {
        "A": "Identify distributions of 2 continuous and 2 categorical variables with univariate statistics. Two sentences:",
        "A1": "Provide visuals of distributions for all 4 variables from A. Two sentences:",
        "B": "Identify distributions of 2 continuous and 2 categorical variables with bivariate statistics. Two sentences:",
        "B1": "Provide visuals of distributions for all 4 variables from B. Two sentences:",
        "C1": "Provide a research question addressable by the dataset and relevant to a realistic need; explain in two sentences:",
        "C2": "Identify specific variables relevant to C1. Two sentences:",
        "D1": "Identify a relevant parametric test for C1. Two sentences:",
        "D2": "Develop null and alternative hypotheses related to D1. Two sentences:",
        "D3": "Provide warning-/error-free code to analyze the dataset with the chosen parametric technique. Two sentences:",
        "D4": "Include output and all results of calculations. Two sentences:",
        "E1": "Justify why the chosen parametric test was selected and matches D1. Two sentences:",
        "E2": "Discuss results including the decision on the null hypothesis from D2. Two sentences:",
        "E3": "Explain how stakeholders could benefit from the analysis. Two sentences:",
    },
}
