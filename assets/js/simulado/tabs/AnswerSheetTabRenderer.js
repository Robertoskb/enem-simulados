import { BaseTabRenderer } from "./BaseTabRenderer.js";

export class AnswerSheetTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
  }

  render() {
    const container = document.getElementById("answer-sheet-container");
    if (!container) return;

    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();

    container.innerHTML = this.renderAnswerSheetTable(questions, answers);
  }

  renderAnswerSheetTable(questions, answers) {
    const areaNames = {
      LC0: "Linguagens (Inglês)",
      LC1: "Linguagens (Espanhol)",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };

    let html = `
      <div class="answer-sheet" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 2rem;
      ">
        <div style="
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 1.5rem;
          margin-bottom: 0;
        ">
          <h4 style="
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            display: flex;
            align-items: center;
          ">
            <i class="fa fa-clipboard-list" style="margin-right: 0.75rem; font-size: 1.75rem;"></i>
            Cartão de Respostas
          </h4>
        </div>
        
        <div class="table-responsive" style="margin: 1.5rem;">
          <table class="answer-sheet-table" style="
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          ">
            <thead>
              <tr style="
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-bottom: 2px solid #dee2e6;
              ">
                <th style="
                  padding: 1rem;
                  text-align: left;
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border-right: 1px solid #dee2e6;
                ">Questão</th>
                <th style="
                  padding: 1rem;
                  text-align: left;
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border-right: 1px solid #dee2e6;
                ">Área</th>
                <th style="
                  padding: 1rem;
                  text-align: center;
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border-right: 1px solid #dee2e6;
                ">Sua Resposta</th>
                <th style="
                  padding: 1rem;
                  text-align: center;
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border-right: 1px solid #dee2e6;
                ">Gabarito</th>
                <th style="
                  padding: 1rem;
                  text-align: center;
                  font-weight: 600;
                  color: #495057;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    questions.forEach((question, index) => {
      const userAnswer = answers[question.position];

      // Usar PositionMapper para verificação correta de resposta
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          userAnswer
        );

      const isCorrect = answerCheck.isCorrect;
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);

      // Determinar status baseado na verificação
      let status = "";
      let statusClass = "";

      if (question.cancelled) {
        // Para questões anuladas, usa o resultado da verificação
        status = isCorrect
          ? "Anulada (Respondida)"
          : "Anulada (Não Respondida)";
        statusClass = isCorrect
          ? "answer-cancelled-answered"
          : "answer-cancelled";
      } else {
        // Para questões não anuladas, usa verificação normal
        if (!userAnswer) {
          status = "Não Respondida";
          statusClass = "answer-blank";
        } else if (isCorrect) {
          status = "Correto";
          statusClass = "answer-correct";
        } else {
          status = "Incorreto";
          statusClass = "answer-wrong";
        }
      }

      const getRowStyle = () => {
        if (question.cancelled) {
          return "background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);";
        } else if (!userAnswer) {
          return "background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);";
        } else if (isCorrect) {
          return "background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);";
        } else {
          return "background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);";
        }
      };

      const getBadgeStyle = () => {
        if (question.cancelled) {
          return "background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #212529; border: 1px solid #ffc107;";
        } else if (!userAnswer) {
          return "background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; border: 1px solid #6c757d;";
        } else if (isCorrect) {
          return "background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: 1px solid #28a745;";
        } else {
          return "background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; border: 1px solid #dc3545;";
        }
      };

      html += `
        <tr style="
          ${getRowStyle()}
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        ">
          <td style="
            padding: 1rem;
            font-weight: 600;
            color: #495057;
            border-right: 1px solid rgba(0, 0, 0, 0.05);
          ">${question.position}</td>
          <td style="
            padding: 1rem;
            color: #495057;
            font-size: 0.875rem;
            border-right: 1px solid rgba(0, 0, 0, 0.05);
          ">${areaNames[question.area] || question.area}</td>
          <td class="answer-cell" style="
            padding: 1rem;
            text-align: center;
            border-right: 1px solid rgba(0, 0, 0, 0.05);
          ">
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              font-weight: 700;
              font-size: 1rem;
              ${
                userAnswer
                  ? "background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);"
                  : "background: #f8f9fa; color: #6c757d; border: 2px dashed #dee2e6;"
              }
            ">
              ${userAnswer || "–"}
            </span>
          </td>
          <td class="answer-cell" style="
            padding: 1rem;
            text-align: center;
            border-right: 1px solid rgba(0, 0, 0, 0.05);
          ">
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              font-weight: 700;
              font-size: 1rem;
              ${
                question.cancelled
                  ? "background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #212529; box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);"
                  : "background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);"
              }
            ">
              ${question.cancelled ? "✗" : correctAnswer}
            </span>
          </td>
          <td style="padding: 1rem; text-align: center;">
            <span class="status-badge ${statusClass}" style="
              ${getBadgeStyle()}
              padding: 0.5rem 1rem;
              border-radius: 20px;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              display: inline-block;
              min-width: 120px;
            ">
              ${status}
            </span>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        
        <div class="answer-sheet-summary">
          ${this.renderAnswerSheetSummary(questions, answers)}
        </div>
      </div>
    `;

    return html;
  }

  renderAnswerSheetSummary(questions, answers) {
    let correct = 0;
    let incorrect = 0;
    let blank = 0;
    let cancelledAnswered = 0;
    let cancelledBlank = 0;

    questions.forEach((question) => {
      const userAnswer = answers[question.position];

      // Usar PositionMapper para verificação correta
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          userAnswer
        );

      if (question.cancelled) {
        if (answerCheck.isCorrect) {
          cancelledAnswered++;
          correct++; // Questões anuladas respondidas contam como corretas
        } else {
          cancelledBlank++;
        }
      } else {
        if (!userAnswer) {
          blank++;
        } else if (answerCheck.isCorrect) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    const total = questions.length;
    const answered = total - blank - cancelledBlank;
    const accuracy =
      answered > 0 ? ((correct / total) * 100).toFixed(1) : "0.0";

    return `
      <div class="summary-container" style="
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #dee2e6;
      ">
        <h5 style="
          margin: 0 0 1.5rem 0;
          color: #495057;
          font-weight: 600;
          display: flex;
          align-items: center;
        ">
          <i class="fa fa-chart-bar" style="margin-right: 0.5rem; color: #007bff;"></i>
          Resumo do Desempenho
        </h5>
        
        <div class="summary-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        ">
          <div class="summary-item" style="
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #b8dabc;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.1);
            transition: transform 0.2s ease;
          ">
            <div class="summary-number correct" style="
              font-size: 2.5rem;
              font-weight: 700;
              color: #155724;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa fa-check-circle" style="
                margin-right: 0.5rem;
                font-size: 2rem;
                color: #28a745;
              "></i>
              ${correct}
            </div>
            <div class="summary-label" style="
              font-size: 1rem;
              color: #155724;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Corretas</div>
          </div>
          
          <div class="summary-item" style="
            background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);
            border: 1px solid #f5c6cb;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(220, 53, 69, 0.1);
            transition: transform 0.2s ease;
          ">
            <div class="summary-number incorrect" style="
              font-size: 2.5rem;
              font-weight: 700;
              color: #721c24;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa fa-times-circle" style="
                margin-right: 0.5rem;
                font-size: 2rem;
                color: #dc3545;
              "></i>
              ${incorrect}
            </div>
            <div class="summary-label" style="
              font-size: 1rem;
              color: #721c24;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Incorretas</div>
          </div>
          
          <div class="summary-item" style="
            background: linear-gradient(135deg, #e2e3e5 0%, #d1d3d5 100%);
            border: 1px solid #c6c8ca;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(108, 117, 125, 0.1);
            transition: transform 0.2s ease;
          ">
            <div class="summary-number blank" style="
              font-size: 2.5rem;
              font-weight: 700;
              color: #383d41;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa fa-minus-circle" style="
                margin-right: 0.5rem;
                font-size: 2rem;
                color: #6c757d;
              "></i>
              ${blank + cancelledBlank}
            </div>
            <div class="summary-label" style="
              font-size: 1rem;
              color: #383d41;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Não Respondidas</div>
          </div>
          
          <div class="summary-item" style="
            background: linear-gradient(135deg, #cce7ff 0%, #b3d7ff 100%);
            border: 1px solid #b8daff;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1);
            transition: transform 0.2s ease;
          ">
            <div class="summary-number accuracy" style="
              font-size: 2.5rem;
              font-weight: 700;
              color: #004085;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa fa-percentage" style="
                margin-right: 0.5rem;
                font-size: 2rem;
                color: #007bff;
              "></i>
              ${accuracy}%
            </div>
            <div class="summary-label" style="
              font-size: 1rem;
              color: #004085;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Taxa de Acerto</div>
          </div>
          
          ${
            cancelledAnswered > 0 || cancelledBlank > 0
              ? `
          <div class="summary-item cancelled" style="
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffc107;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(255, 193, 7, 0.1);
            transition: transform 0.2s ease;
            grid-column: span 2;
          ">
            <div class="summary-number" style="
              font-size: 2.5rem;
              font-weight: 700;
              color: #856404;
              margin-bottom: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fa fa-ban" style="
                margin-right: 0.5rem;
                font-size: 2rem;
                color: #ffc107;
              "></i>
              ${cancelledAnswered + cancelledBlank}
            </div>
            <div class="summary-label" style="
              font-size: 1rem;
              color: #856404;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 0.5rem;
            ">Anuladas</div>
            <div class="summary-detail" style="
              font-size: 0.875rem;
              color: #856404;
              background: rgba(255, 193, 7, 0.2);
              padding: 0.5rem 1rem;
              border-radius: 20px;
              display: inline-block;
            ">
              ${cancelledAnswered} respondidas • ${cancelledBlank} em branco
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }
}
