import React, { useState } from 'react';
import { NumericFormat, PatternFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Clock, Users, MapPin, Info, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const ServicePricingCalculator = () => {
  const [step, setStep] = useState(1);
  
  const [custoMaoObra, setCustoMaoObra] = useState<number>(0);
  const [custoMaterial, setCustoMaterial] = useState<number>(0);
  const [horasServico, setHorasServico] = useState('');
  
  const [capacidade, setCapacidade] = useState('');
  const [custoFixo, setCustoFixo] = useState<number>(0);
  const [margemLucro, setMargemLucro] = useState<number>(0);
  
  const [segmento, setSegmento] = useState('');
  const [estado, setEstado] = useState('');

  const [resultado, setResultado] = useState<{ minimo: number; comLucro: number; breakeven: number } | null>(null);

  const parseHours = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/_/g, '');
    const parts = clean.split(':');
    const h = parseInt(parts[0] || '0');
    const m = parseInt(parts[1] || '0');
    return h + m / 60;
  };

  const calculate = () => {
    const hs = parseHours(horasServico);
    const cap = parseHours(capacidade);

    const custoDireto = (custoMaterial || 0) + ((custoMaoObra || 0) * hs);
    const custoFixoHora = cap > 0 ? (custoFixo || 0) / cap : 0;
    const custoFixoServico = custoFixoHora * hs;
    
    const custoTotal = custoDireto + custoFixoServico;
    const minimo = custoTotal;
    
    let comLucro = minimo;
    if (margemLucro > 0 && margemLucro < 100) {
      comLucro = minimo / (1 - margemLucro / 100);
    } else if (margemLucro >= 100) {
      comLucro = minimo * (1 + margemLucro / 100);
    }
    
    const margemContribuicao = comLucro - custoDireto;
    const breakeven = margemContribuicao > 0 ? Math.ceil((custoFixo || 0) / margemContribuicao) : 0;

    setResultado({ minimo, comLucro, breakeven });
    setStep(4);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8 mt-2">
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300",
            step >= i ? "bg-purple-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
          )}>
            {i}
          </div>
          {i < 3 && (
            <div className={cn(
              "w-8 h-0.5",
              step > i ? "bg-purple-600" : "bg-zinc-200 dark:bg-zinc-800"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const InputWithIcon = ({ icon: Icon, label, tooltip, children, id }: any) => {
    return (
      <div className="space-y-1.5 w-full">
        <Label htmlFor={id} className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help hover:opacity-80 transition-opacity">
                <Info className="w-3.5 h-3.5 text-purple-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <div className="relative flex items-center">
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-10 pointer-events-none">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {children}
        </div>
      </div>
    );
  };

  if (step === 4 && resultado) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Resultado</h3>
        
        <div className="w-full space-y-4 text-center">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Preço mínimo</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {resultado.minimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 rounded-xl">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Preço com lucro</p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {resultado.comLucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Breakeven (serviços/mês)</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {resultado.breakeven}
            </p>
          </div>
        </div>

        <Button 
          className="w-full sm:w-auto mt-4 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300"
          onClick={() => {
            setStep(1);
            setResultado(null);
          }}
        >
          Recalcular
        </Button>

        <a href="#" className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-6 flex items-center gap-1">
          Tenha um material completo para aprender a precificar seu serviço
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
        </a>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {renderStepIndicator()}

        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="custoMaoObra" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Custo mão de obra | R$/h
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Valor pago pela sua hora de trabalho</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <NumericFormat
                    id="custoMaoObra"
                    name="custoMaoObra"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    value={custoMaoObra || 0}
                    onValueChange={(values) => setCustoMaoObra(values.floatValue || 0)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="custoMaterial" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Custo de material | R$
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Custo dos materiais usados no serviço</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <NumericFormat
                    id="custoMaterial"
                    name="custoMaterial"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    value={custoMaterial || 0}
                    onValueChange={(values) => setCustoMaterial(values.floatValue || 0)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="horasServico" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Horas de serviço | horas:minutos
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Tempo gasto para concluir o serviço</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <PatternFormat
                    id="horasServico"
                    name="horasServico"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    format="##:##"
                    placeholder="00:00"
                    value={horasServico}
                    onValueChange={(values) => setHorasServico(values.formattedValue)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="capacidade" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Capacidade (horas/mês) | h:mm
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Total de horas produtivas por mês</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <PatternFormat
                    id="capacidade"
                    name="capacidade"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    format="###:##"
                    placeholder="160:00"
                    value={capacidade}
                    onValueChange={(values) => setCapacidade(values.formattedValue)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="custoFixo" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Custo fixo total | R$
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Total de despesas fixas no mês</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <NumericFormat
                    id="custoFixo"
                    name="custoFixo"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    value={custoFixo}
                    onValueChange={(values) => setCustoFixo(values.floatValue || 0)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="margemLucro" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Margem de lucro desejada | %
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Percentual de lucro sobre o preço final</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <span className="text-white font-bold">%</span>
                  </div>
                  <NumericFormat
                    id="margemLucro"
                    name="margemLucro"
                    customInput={Input}
                    className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600"
                    decimalSeparator=","
                    decimalScale={2}
                    value={margemLucro}
                    onValueChange={(values) => setMargemLucro(values.floatValue || 0)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="segmento" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Qual Segmento de atuação?
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Seu nicho de mercado (opcional)</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <Select value={segmento} onValueChange={setSegmento}>
                    <SelectTrigger id="segmento" className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600">
                      <SelectValue placeholder="Selecione um segmento" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="engenharia">Engenharia</SelectItem>
                      <SelectItem value="ti">Tecnologia (TI)</SelectItem>
                      <SelectItem value="design">Design / Criatividade</SelectItem>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="beleza">Estética / Beleza</SelectItem>
                      <SelectItem value="manutencao">Manutenção / Reparos</SelectItem>
                      <SelectItem value="outro">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estado" className="text-zinc-400 flex items-center gap-1.5 font-medium px-1">
                  Qual o Estado?
                  <Tooltip>
                    <TooltipTrigger type="button" className="p-0 border-0 bg-transparent cursor-help">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                    </TooltipTrigger>
                    <TooltipContent>Sua localização (opcional)</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-zinc-800 border-r border-zinc-700 w-11 rounded-l-xl z-20 pointer-events-none">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger id="estado" className="h-11 w-full pl-14 bg-zinc-800/60 border-zinc-700 text-white rounded-xl focus:ring-1 focus:ring-purple-600 focus:border-purple-600">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="sp">São Paulo</SelectItem>
                      <SelectItem value="rj">Rio de Janeiro</SelectItem>
                      <SelectItem value="mg">Minas Gerais</SelectItem>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                      <SelectItem value="pr">Paraná</SelectItem>
                      <SelectItem value="oculto">Preferir não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

      <div className="flex items-center justify-between mt-8 pt-4">
         <div>
          {step > 1 && (
            <Button 
              variant="outline" 
              className="bg-zinc-200 hover:bg-zinc-300 text-zinc-600 border-0 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
              onClick={() => setStep(step - 1)}
            >
              &larr; Anterior
            </Button>
          )}
         </div>
         
         {step < 3 ? (
            <Button 
              className="bg-purple-700 hover:bg-purple-800 text-white min-w-[100px]"
              onClick={() => setStep(step + 1)}
            >
              Próximo &rarr;
            </Button>
         ) : (
            <Button 
              className="bg-purple-700 hover:bg-purple-800 text-white min-w-[100px]"
              onClick={calculate}
            >
              Calcular
            </Button>
         )}
      </div>
      </div>
    </TooltipProvider>
  );
};
