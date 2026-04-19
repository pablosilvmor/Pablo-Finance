import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { 
  TrendingUp, 
  LineChart, 
  CalendarDays, 
  CalendarRange, 
  Umbrella, 
  Plane, 
  DollarSign, 
  Clock, 
  Calendar, 
  Lock, 
  FileText, 
  CircleDollarSign, 
  BarChart, 
  Percent, 
  CalendarMinus, 
  Divide, 
  HelpCircle, 
  BadgeDollarSign, 
  Car,
  Star,
  Search,
  Scale as ScaleIcon,
  Maximize,
  Zap,
  Coins,
  Ruler,
  Box,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumericFormat } from 'react-number-format';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CalculationShareDialog } from '@/components/CalculationShareDialog';

const calculators = [
  { id: 'juros-composto', name: 'Juros composto', icon: TrendingUp, category: 'calculator' },
  { id: 'juros-simples', name: 'Juros simples', icon: LineChart, category: 'calculator' },
  { id: 'juros-mensal-anual', name: 'Juros mensal em anual', icon: CalendarDays, category: 'calculator' },
  { id: 'juros-anual-mensal', name: 'Juros anual em mensal', icon: CalendarRange, category: 'calculator' },
  { id: 'ferias', name: 'Férias', icon: Umbrella, category: 'calculator' },
  { id: 'ferias-prop', name: 'Férias proporcionais', icon: Plane, category: 'calculator' },
  { id: 'salario-liquido', name: 'Salário líquido', icon: DollarSign, category: 'calculator' },
  { id: 'hora-extra', name: 'Hora extra', icon: Clock, category: 'calculator' },
  { id: 'investimento', name: 'Investimento', icon: TrendingUp, category: 'calculator' },
  { id: 'decimo-terceiro', name: 'Décimo terceiro', icon: Calendar, category: 'calculator' },
  { id: 'fgts', name: 'FGTS', icon: Lock, category: 'calculator' },
  { id: 'rescisao', name: 'Rescisão', icon: FileText, category: 'calculator' },
  { id: 'rendimento-poupanca', name: 'Rendimento da poupança', icon: CircleDollarSign, category: 'calculator' },
  { id: 'taxa-equivalente', name: 'Taxa equivalente', icon: BarChart, category: 'calculator' },
  { id: 'porcentagem', name: 'Porcentagem', icon: Percent, category: 'calculator' },
  { id: 'contador-dias', name: 'Contador de dias', icon: CalendarMinus, category: 'calculator' },
  { id: 'regra-tres', name: 'Regra de três simples', icon: Divide, category: 'calculator' },
  { id: 'quantos-dias', name: 'Quantos dias faltam', icon: HelpCircle, category: 'calculator' },
  { id: 'emprestimo', name: 'Empréstimo Pessoal', icon: BadgeDollarSign, category: 'calculator' },
  { id: 'financiamento', name: 'Financiamento de Veículos', icon: Car, category: 'calculator' },
  // Conversores
  { id: 'conv-massa', name: 'Massa', icon: ScaleIcon, category: 'converter' },
  { id: 'conv-area', name: 'Área', icon: Maximize, category: 'converter' },
  { id: 'conv-velocidade', name: 'Velocidade', icon: Zap, category: 'converter' },
  { id: 'conv-moeda', name: 'Moeda', icon: Coins, category: 'converter' },
  { id: 'conv-comprimento', name: 'Comprimento', icon: Ruler, category: 'converter' },
  { id: 'conv-volume', name: 'Volume', icon: Box, category: 'converter' },
].sort((a, b) => a.name.localeCompare(b.name));

const units: Record<string, { label: string; factor: number; symbol: string }[]> = {
  'conv-massa': [
    { label: 'Quilograma', factor: 1, symbol: 'kg' },
    { label: 'Grama', factor: 1000, symbol: 'g' },
    { label: 'Miligrama', factor: 1000000, symbol: 'mg' },
    { label: 'Libra', factor: 2.20462, symbol: 'lb' },
    { label: 'Onça', factor: 35.274, symbol: 'oz' },
  ],
  'conv-area': [
    { label: 'Metro quadrado', factor: 1, symbol: 'm²' },
    { label: 'Quilômetro quadrado', factor: 0.000001, symbol: 'km²' },
    { label: 'Hectare', factor: 0.0001, symbol: 'ha' },
    { label: 'Acre', factor: 0.000247105, symbol: 'ac' },
    { label: 'Pé quadrado', factor: 10.7639, symbol: 'ft²' },
  ],
  'conv-velocidade': [
    { label: 'km/h', factor: 1, symbol: 'km/h' },
    { label: 'm/s', factor: 1/3.6, symbol: 'm/s' },
    { label: 'mph', factor: 0.621371, symbol: 'mph' },
    { label: 'nós', factor: 0.539957, symbol: 'kn' },
  ],
  'conv-moeda': [
    { label: 'Real (BRL)', factor: 1, symbol: 'R$' },
    { label: 'Dólar (USD)', factor: 0.18, symbol: '$' },
    { label: 'Euro (EUR)', factor: 0.17, symbol: '€' },
    { label: 'Libra (GBP)', factor: 0.14, symbol: '£' },
    { label: 'Iene (JPY)', factor: 28.0, symbol: '¥' },
  ],
  'conv-comprimento': [
    { label: 'Metro', factor: 1, symbol: 'm' },
    { label: 'Quilômetro', factor: 0.001, symbol: 'km' },
    { label: 'Centímetro', factor: 100, symbol: 'cm' },
    { label: 'Milímetro', factor: 1000, symbol: 'mm' },
    { label: 'Milha', factor: 0.000621371, symbol: 'mi' },
    { label: 'Pé', factor: 3.28084, symbol: 'ft' },
    { label: 'Polegada', factor: 39.3701, symbol: 'in' },
  ],
  'conv-volume': [
    { label: 'Litro', factor: 1, symbol: 'l' },
    { label: 'Mililitro', factor: 1000, symbol: 'ml' },
    { label: 'Metro cúbico', factor: 0.001, symbol: 'm³' },
    { label: 'Galão (EUA)', factor: 0.264172, symbol: 'gal' },
  ],
};

export const Calculators = () => {
  const { userSettings, updateUserSettings } = useAppStore();
  const [selectedCalc, setSelectedCalc] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [calculationMemory, setCalculationMemory] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const favorites = userSettings.favoriteCalculators || [];

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    updateUserSettings({ favoriteCalculators: newFavorites });
  };

  const filteredCalculators = calculators.filter(calc => 
    calc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoriteCalculators = calculators.filter(calc => favorites.includes(calc.id));
  const otherCalculators = filteredCalculators.filter(calc => !favorites.includes(calc.id) && calc.category === 'calculator');
  const otherConverters = filteredCalculators.filter(calc => !favorites.includes(calc.id) && calc.category === 'converter');

  // States for Juros Composto / Simples
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');

  // States for Salário Líquido
  const [grossSalary, setGrossSalary] = useState('');
  const [dependents, setDependents] = useState('0');

  // States for Porcentagem
  const [percentValue, setPercentValue] = useState('');
  const [totalValue, setTotalValue] = useState('');

  // States for Regra de Tres
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');
  const [valC, setValC] = useState('');

  // States for Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // States for new calculators
  const [days, setDays] = useState('');
  const [abonoPecuniario, setAbonoPecuniario] = useState(false);
  const [workHours, setWorkHours] = useState('220');
  const [extraHours, setExtraHours] = useState('');
  const [extraRate, setExtraRate] = useState('50');
  const [monthsWorked, setMonthsWorked] = useState('12');

  // States for Converters
  const [convValue, setConvValue] = useState('1');
  const [unitFrom, setUnitFrom] = useState('');
  const [unitTo, setUnitTo] = useState('');

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const handleConverterCalculate = () => {
    if (!selectedCalc || !units[selectedCalc]) return;
    const val = parseFloat(convValue);
    const fromUnit = units[selectedCalc].find(u => u.label === unitFrom);
    const toUnit = units[selectedCalc].find(u => u.label === unitTo);

    if (!isNaN(val) && fromUnit && toUnit) {
      const baseVal = val / fromUnit.factor;
      const finalVal = baseVal * toUnit.factor;
      setResult(finalVal);
      setResultText(`${finalVal.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} ${toUnit.symbol}`);
      setCalculationMemory(`Conversão: ${val} ${fromUnit.symbol} para ${toUnit.symbol}\nFator de conversão: ${fromUnit.label} (${fromUnit.factor}) -> ${toUnit.label} (${toUnit.factor})\nCálculo: (${val} / ${fromUnit.factor}) * ${toUnit.factor} = ${finalVal}`);
    }
  };

  const handleCalculateJurosComposto = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);
    if (!isNaN(p) && !isNaN(r) && !isNaN(t)) {
      const amount = p * Math.pow((1 + r), t);
      setResult(amount);
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
      setResultText(formattedAmount);
      setCalculationMemory(`Fórmula: M = C * (1 + i)^t\nM = ${p} * (1 + ${r})^${t}\nM = ${formattedAmount}`);
    }
  };

  const handleCalculateJurosSimples = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);
    if (!isNaN(p) && !isNaN(r) && !isNaN(t)) {
      const amount = p + (p * r * t);
      setResult(amount);
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
      setResultText(formattedAmount);
      setCalculationMemory(`Fórmula: M = C + (C * i * t)\nM = ${p} + (${p} * ${r} * ${t})\nM = ${formattedAmount}`);
    }
  };

  const handleCalculateMensalAnual = () => {
    const r = parseFloat(rate) / 100;
    if (!isNaN(r)) {
      const annual = (Math.pow(1 + r, 12) - 1) * 100;
      setResult(annual);
      setResultText(`${annual.toFixed(2)}% ao ano`);
      setCalculationMemory(`Fórmula: ia = ((1 + im)^12 - 1) * 100\nia = ((1 + ${r})^12 - 1) * 100\nia = ${annual.toFixed(2)}%`);
    }
  };

  const handleCalculateAnualMensal = () => {
    const r = parseFloat(rate) / 100;
    if (!isNaN(r)) {
      const monthly = (Math.pow(1 + r, 1 / 12) - 1) * 100;
      setResult(monthly);
      setResultText(`${monthly.toFixed(2)}% ao mês`);
      setCalculationMemory(`Fórmula: im = ((1 + ia)^(1/12) - 1) * 100\nim = ((1 + ${r})^(1/12) - 1) * 100\nim = ${monthly.toFixed(2)}%`);
    }
  };

  const handleCalculatePorcentagem = () => {
    const p = parseFloat(percentValue);
    const t = parseFloat(totalValue);
    if (!isNaN(p) && !isNaN(t)) {
      const res = (p / 100) * t;
      setResult(res);
      setResultText(res.toString());
      setCalculationMemory(`Cálculo: (${p} / 100) * ${t} = ${res}`);
    }
  };

  const handleCalculateRegraTres = () => {
    const a = parseFloat(valA);
    const b = parseFloat(valB);
    const c = parseFloat(valC);
    if (!isNaN(a) && !isNaN(b) && !isNaN(c) && a !== 0) {
      const x = (b * c) / a;
      setResult(x);
      setResultText(x.toString());
      setCalculationMemory(`Cálculo: X = (${b} * ${c}) / ${a}\nX = ${x}`);
    }
  };

  const handleCalculateContadorDias = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      setResult(diffDays);
      setResultText(`${diffDays} dias`);
      setCalculationMemory(`Data Inicial: ${start.toLocaleDateString('pt-BR')}\nData Final: ${end.toLocaleDateString('pt-BR')}\nDiferença: ${diffDays} dias`);
    }
  };

  const handleCalculateQuantosDias = () => {
    if (endDate) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      setResult(diffDays);
      if (diffDays < 0) {
        setResultText(`Já se passaram ${Math.abs(diffDays)} dias`);
      } else if (diffDays === 0) {
        setResultText('É hoje!');
      } else {
        setResultText(`Faltam ${diffDays} dias`);
      }
      setCalculationMemory(`Hoje: ${start.toLocaleDateString('pt-BR')}\nData Alvo: ${end.toLocaleDateString('pt-BR')}\nDiferença: ${Math.abs(diffDays)} dias`);
    }
  };

  const handleCalculatePoupanca = () => {
    const p = parseFloat(principal);
    const t = parseFloat(time);
    // Assuming a fixed savings rate of 0.5% per month for simplicity
    const r = 0.005; 
    if (!isNaN(p) && !isNaN(t)) {
      const amount = p * Math.pow((1 + r), t);
      setResult(amount);
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
      setResultText(formattedAmount);
      setCalculationMemory(`Fórmula: M = C * (1 + i)^t\nConsiderando rendimento fixo da poupança de 0,5% ao mês.\nM = ${p} * (1 + 0.005)^${t}\nM = ${formattedAmount}`);
    }
  };

  const handleCalculateSalarioLiquido = () => {
    const gross = parseFloat(grossSalary);
    const deps = parseInt(dependents);
    if (!isNaN(gross)) {
      // Simplified INSS and IRRF calculation for demonstration
      let inss = 0;
      if (gross <= 1412) inss = gross * 0.075;
      else if (gross <= 2666.68) inss = (gross * 0.09) - 21.18;
      else if (gross <= 4000.03) inss = (gross * 0.12) - 101.18;
      else if (gross <= 7786.02) inss = (gross * 0.14) - 181.18;
      else inss = 908.85;

      const baseIRRF = gross - inss - (deps * 189.59);
      let irrf = 0;
      if (baseIRRF <= 2259.20) irrf = 0;
      else if (baseIRRF <= 2826.65) irrf = (baseIRRF * 0.075) - 169.44;
      else if (baseIRRF <= 3751.05) irrf = (baseIRRF * 0.15) - 381.44;
      else if (baseIRRF <= 4664.68) irrf = (baseIRRF * 0.225) - 662.77;
      else irrf = (baseIRRF * 0.275) - 896.00;

      const net = gross - inss - Math.max(0, irrf);
      setResult(net);
      const formattedNet = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(net);
      setResultText(formattedNet);
      
      const formattedGross = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gross);
      const formattedInss = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inss);
      const formattedIrrf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, irrf));
      
      setCalculationMemory(`Salário Bruto: ${formattedGross}\nDesconto INSS: ${formattedInss}\nDesconto IRRF: ${formattedIrrf}\nDependentes: ${deps} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deps * 189.59)})\nCálculo: ${formattedGross} - ${formattedInss} - ${formattedIrrf} = ${formattedNet}`);
    }
  };

  const handleCalculateFerias = () => {
    const gross = parseFloat(grossSalary);
    const d = parseInt(days) || 30;
    if (!isNaN(gross)) {
      const daily = gross / 30;
      const feriasValue = daily * d;
      const terco = feriasValue / 3;
      let total = feriasValue + terco;
      
      let abonoValue = 0;
      let tercoAbonoValue = 0;
      if (abonoPecuniario) {
        abonoValue = (gross / 30) * 10;
        tercoAbonoValue = abonoValue / 3;
        total += abonoValue + tercoAbonoValue;
      }
      
      setResult(total);
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
      setResultText(formattedTotal);
      
      const formattedFerias = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feriasValue);
      const formattedTerco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(terco);
      
      let memory = `Valor das Férias (${d} dias): ${formattedFerias}\n1/3 Constitucional: ${formattedTerco}`;
      if (abonoPecuniario) {
        memory += `\nAbono Pecuniário (10 dias): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(abonoValue)}\n1/3 do Abono: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tercoAbonoValue)}`;
      }
      memory += `\nTotal Bruto: ${formattedTotal}`;
      setCalculationMemory(memory);
    }
  };

  const handleCalculateHoraExtra = () => {
    const gross = parseFloat(grossSalary);
    const wh = parseFloat(workHours);
    const eh = parseFloat(extraHours);
    const er = parseFloat(extraRate) / 100;
    
    if (!isNaN(gross) && !isNaN(wh) && !isNaN(eh) && !isNaN(er)) {
      const hourValue = gross / wh;
      const extraHourValue = hourValue * (1 + er);
      const totalExtra = extraHourValue * eh;
      
      setResult(totalExtra);
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExtra);
      setResultText(formattedTotal);
      
      const formattedHour = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(hourValue);
      const formattedExtraHour = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extraHourValue);
      
      setCalculationMemory(`Valor da Hora Normal: ${formattedHour}\nValor da Hora Extra (${extraRate}%): ${formattedExtraHour}\nCálculo: ${formattedExtraHour} * ${eh} horas = ${formattedTotal}`);
    }
  };

  const handleCalculateDecimoTerceiro = () => {
    const gross = parseFloat(grossSalary);
    const months = parseInt(monthsWorked);
    
    if (!isNaN(gross) && !isNaN(months)) {
      const value = (gross / 12) * months;
      setResult(value);
      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      setResultText(formattedValue);
      
      const formattedMonthly = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gross / 12);
      setCalculationMemory(`Valor por Mês (1/12): ${formattedMonthly}\nMeses Trabalhados: ${months}\nCálculo: ${formattedMonthly} * ${months} = ${formattedValue}`);
    }
  };

  const handleCalculateEmprestimo = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseInt(time);
    
    if (!isNaN(p) && !isNaN(r) && !isNaN(t) && r > 0) {
      // PMT formula: P * (r * (1 + r)^t) / ((1 + r)^t - 1)
      const pmt = p * (r * Math.pow(1 + r, t)) / (Math.pow(1 + r, t) - 1);
      setResult(pmt);
      const formattedPmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pmt);
      setResultText(formattedPmt + ' por mês');
      
      const totalPaid = pmt * t;
      const totalInterest = totalPaid - p;
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid);
      const formattedInterest = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInterest);
      
      setCalculationMemory(`Fórmula PMT (Tabela Price)\nValor da Parcela: ${formattedPmt}\nTotal Pago ao Final: ${formattedTotal}\nTotal de Juros Pagos: ${formattedInterest}`);
    }
  };

  const handleCalculateFGTS = () => {
    const gross = parseFloat(grossSalary);
    const months = parseInt(monthsWorked);
    if (!isNaN(gross) && !isNaN(months)) {
      const fgtsMonthly = gross * 0.08;
      const total = fgtsMonthly * months;
      setResult(total);
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
      setResultText(formattedTotal);
      
      const formattedMonthly = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fgtsMonthly);
      setCalculationMemory(`Depósito Mensal (8%): ${formattedMonthly}\nMeses Trabalhados: ${months}\nCálculo: ${formattedMonthly} * ${months} = ${formattedTotal}`);
    }
  };

  const handleCalculateRescisao = () => {
    const gross = parseFloat(grossSalary);
    const months = parseInt(monthsWorked);
    if (!isNaN(gross) && !isNaN(months)) {
      // Simplificação: Saldo de salário (assumindo 30 dias) + 13º proporcional + Férias proporcionais + 1/3
      const saldoSalario = gross;
      const decimoTerceiroProp = (gross / 12) * Math.min(months, 12);
      const feriasProp = (gross / 12) * Math.min(months, 12);
      const tercoFerias = feriasProp / 3;
      const total = saldoSalario + decimoTerceiroProp + feriasProp + tercoFerias;
      
      setResult(total);
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
      setResultText(formattedTotal);
      
      setCalculationMemory(`Saldo de Salário: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoSalario)}\n13º Proporcional: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(decimoTerceiroProp)}\nFérias Proporcionais: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(feriasProp)}\n1/3 Férias: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tercoFerias)}\nTotal Bruto: ${formattedTotal}`);
    }
  };

  const handleCalculateTaxaEquivalente = () => {
    const r = parseFloat(rate) / 100;
    const t = parseInt(time); // Prazo em dias
    if (!isNaN(r) && !isNaN(t)) {
      // Taxa equivalente para o período informado (ex: taxa mensal para diária se t=1/30)
      const eqRate = (Math.pow(1 + r, t) - 1) * 100;
      setResult(eqRate);
      setResultText(`${eqRate.toFixed(4)}%`);
      setCalculationMemory(`Fórmula: teq = ((1 + i)^t - 1) * 100\nteq = ((1 + ${r})^${t} - 1) * 100\nteq = ${eqRate.toFixed(4)}%`);
    }
  };

  const renderCalculatorContent = () => {
    if (selectedCalc === 'juros-composto' || selectedCalc === 'investimento' || selectedCalc === 'juros-simples') {
      const isSimples = selectedCalc === 'juros-simples';
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Inicial (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={principal}
              onValueChange={(values) => setPrincipal(values.value)}
              placeholder="Ex: 1000"
            />
          </div>
          <div className="space-y-2">
            <Label>Taxa de Juros Mensal (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={rate} onValueChange={(values) => setRate(values.value)} placeholder="Ex: 1" />
          </div>
          <div className="space-y-2">
            <Label>Período (Meses)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={time} onValueChange={(values) => setTime(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={isSimples ? handleCalculateJurosSimples : handleCalculateJurosComposto}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Final</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'rendimento-poupanca') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Inicial (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={principal}
              onValueChange={(values) => setPrincipal(values.value)}
              placeholder="Ex: 1.000,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Período (Meses)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={time} onValueChange={(values) => setTime(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculatePoupanca}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Final Estimado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Considerando rendimento de 0,5% ao mês.</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'juros-mensal-anual' || selectedCalc === 'juros-anual-mensal') {
      const isMensalAnual = selectedCalc === 'juros-mensal-anual';
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Taxa de Juros {isMensalAnual ? 'Mensal' : 'Anual'} (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={rate} onValueChange={(values) => setRate(values.value)} placeholder="Ex: 1" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={isMensalAnual ? handleCalculateMensalAnual : handleCalculateAnualMensal}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Taxa Equivalente</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'porcentagem') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Porcentagem (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={percentValue} onValueChange={(values) => setPercentValue(values.value)} placeholder="Ex: 20" />
          </div>
          <div className="space-y-2">
            <Label>Valor Total</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={totalValue}
              onValueChange={(values) => setTotalValue(values.value)}
              placeholder="Ex: 500,00"
            />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculatePorcentagem}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Resultado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'regra-tres') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Se</Label>
              <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={valA} onValueChange={(values) => setValA(values.value)} placeholder="A" />
            </div>
            <div className="space-y-2">
              <Label>Está para</Label>
              <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={valB} onValueChange={(values) => setValB(values.value)} placeholder="B" />
            </div>
            <div className="space-y-2">
              <Label>Assim como</Label>
              <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={valC} onValueChange={(values) => setValC(values.value)} placeholder="C" />
            </div>
            <div className="space-y-2">
              <Label>Está para</Label>
              <Input type="text" value="X" disabled className="bg-secondary text-center font-bold" />
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateRegraTres}>Calcular X</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor de X</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'contador-dias') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateContadorDias}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Diferença</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'quantos-dias') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data Alvo</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateQuantosDias}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Resultado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'salario-liquido') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Número de Dependentes</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={dependents} onValueChange={(values) => setDependents(values.value)} placeholder="Ex: 0" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateSalarioLiquido}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Salário Líquido Estimado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'ferias' || selectedCalc === 'ferias-prop') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Dias de Férias</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={days} onValueChange={(values) => setDays(values.value)} placeholder="Ex: 30" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="abono" 
              checked={abonoPecuniario} 
              onChange={e => setAbonoPecuniario(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
            />
            <Label htmlFor="abono" className="cursor-pointer">Vender 1/3 das férias (Abono pecuniário)</Label>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateFerias}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Bruto Estimado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'hora-extra') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Jornada Mensal (Horas)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={workHours} onValueChange={(values) => setWorkHours(values.value)} placeholder="Ex: 220" />
          </div>
          <div className="space-y-2">
            <Label>Quantidade de Horas Extras</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={extraHours} onValueChange={(values) => setExtraHours(values.value)} placeholder="Ex: 10" />
          </div>
          <div className="space-y-2">
            <Label>Percentual da Hora Extra (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={extraRate} onValueChange={(values) => setExtraRate(values.value)} placeholder="Ex: 50" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateHoraExtra}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor das Horas Extras</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'decimo-terceiro') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Meses Trabalhados no Ano</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={monthsWorked} onValueChange={(values) => setMonthsWorked(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateDecimoTerceiro}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Bruto do 13º</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'emprestimo' || selectedCalc === 'financiamento') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor do Empréstimo/Financiamento (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={principal}
              onValueChange={(values) => setPrincipal(values.value)}
              placeholder="Ex: 10.000,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Taxa de Juros Mensal (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={rate} onValueChange={(values) => setRate(values.value)} placeholder="Ex: 1.5" />
          </div>
          <div className="space-y-2">
            <Label>Prazo (Meses)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={time} onValueChange={(values) => setTime(values.value)} placeholder="Ex: 48" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateEmprestimo}>Calcular Parcela</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor da Parcela</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'fgts') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Meses Trabalhados</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={monthsWorked} onValueChange={(values) => setMonthsWorked(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateFGTS}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Estimado do FGTS</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'rescisao') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={grossSalary}
              onValueChange={(values) => setGrossSalary(values.value)}
              placeholder="Ex: 3.500,00"
            />
          </div>
          <div className="space-y-2">
            <Label>Meses Trabalhados no Ano</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={monthsWorked} onValueChange={(values) => setMonthsWorked(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateRescisao}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Valor Estimado da Rescisão</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Cálculo simplificado (sem descontos e multas).</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc === 'taxa-equivalente') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Taxa de Juros (%)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={rate} onValueChange={(values) => setRate(values.value)} placeholder="Ex: 1" />
          </div>
          <div className="space-y-2">
            <Label>Período (Ex: 12 para anual, 0.033 para diária)</Label>
            <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," value={time} onValueChange={(values) => setTime(values.value)} placeholder="Ex: 12" />
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCalculateTaxaEquivalente}>Calcular</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Taxa Equivalente</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (selectedCalc?.startsWith('conv-')) {
      const currentUnits = units[selectedCalc] || [];
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quero converter:</Label>
            <Input 
              type="number" 
              value={convValue} 
              onChange={e => setConvValue(e.target.value)} 
              placeholder="Digite o valor"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>De:</Label>
              <Select value={unitFrom} onValueChange={setUnitFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {currentUnits.map(u => (
                    <SelectItem key={u.label} value={u.label}>{u.label} ({u.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para:</Label>
              <Select value={unitTo} onValueChange={setUnitTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {currentUnits.map(u => (
                    <SelectItem key={u.label} value={u.label}>{u.label} ({u.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleConverterCalculate}>Converter</Button>
          {resultText !== null && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-primary">Resultado</p>
              <p className="text-2xl font-bold text-primary">
                {resultText}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-zinc-500">
        <p>Esta calculadora estará disponível em breve.</p>
      </div>
    );
  };

  const handleClose = () => {
    setSelectedCalc(null);
    setResult(null);
    setResultText(null);
    setCalculationMemory(null);
    setPrincipal('');
    setRate('');
    setTime('');
    setGrossSalary('');
    setDependents('0');
    setPercentValue('');
    setTotalValue('');
    setValA('');
    setValB('');
    setValC('');
    setStartDate('');
    setEndDate('');
    setDays('');
    setAbonoPecuniario(false);
    setWorkHours('220');
    setExtraHours('');
    setExtraRate('50');
    setMonthsWorked('12');
    setConvValue('1');
    setUnitFrom('');
    setUnitTo('');
  };

  const handleOpenCalc = (id: string) => {
    setSelectedCalc(id);
    if (id.startsWith('conv-')) {
      const currentUnits = units[id] || [];
      if (currentUnits.length >= 2) {
        setUnitFrom(currentUnits[0].label);
        setUnitTo(currentUnits[1].label);
      }
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Calculadoras</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Ferramentas para facilitar seus cálculos financeiros</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Buscar ferramenta..." 
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {favoriteCalculators.length > 0 && searchTerm === '' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Favoritos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteCalculators.map((calc) => (
              <Card 
                key={calc.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-primary/50 relative"
                onClick={() => handleOpenCalc(calc.id)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                    <calc.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">{calc.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "absolute top-2 right-2 transition-all duration-200",
                      favorites.includes(calc.id) 
                        ? "opacity-100" 
                        : "opacity-0 group-hover:opacity-100 md:opacity-0 lg:opacity-0"
                    )}
                    onClick={(e) => toggleFavorite(e, calc.id)}
                  >
                    <Star className={cn("w-4 h-4", favorites.includes(calc.id) ? "text-yellow-500 fill-yellow-500" : "text-zinc-400")} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherCalculators.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Calculadoras</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherCalculators.map((calc) => (
              <Card 
                key={calc.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-primary/50 relative"
                onClick={() => handleOpenCalc(calc.id)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                    <calc.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">{calc.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "absolute top-2 right-2 transition-all duration-200",
                      favorites.includes(calc.id) 
                        ? "opacity-100" 
                        : "opacity-0 group-hover:opacity-100 md:opacity-0 lg:opacity-0"
                    )}
                    onClick={(e) => toggleFavorite(e, calc.id)}
                  >
                    <Star className={cn("w-4 h-4", favorites.includes(calc.id) ? "text-yellow-500 fill-yellow-500" : "text-zinc-400")} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherConverters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Conversores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherConverters.map((calc) => (
              <Card 
                key={calc.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-primary/50 relative"
                onClick={() => handleOpenCalc(calc.id)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                    <calc.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">{calc.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "absolute top-2 right-2 transition-all duration-200",
                      favorites.includes(calc.id) 
                        ? "opacity-100" 
                        : "opacity-0 group-hover:opacity-100 md:opacity-0 lg:opacity-0"
                    )}
                    onClick={(e) => toggleFavorite(e, calc.id)}
                  >
                    <Star className={cn("w-4 h-4", favorites.includes(calc.id) ? "text-yellow-500 fill-yellow-500" : "text-zinc-400")} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedCalc} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {calculators.find(c => c.id === selectedCalc)?.name}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para realizar o cálculo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {renderCalculatorContent()}
          </div>

          {resultText && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Memória de Cálculo</p>
                <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono">
                  {calculationMemory}
                </pre>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl gap-2"
                  onClick={async () => {
                    const text = `${calculators.find(c => c.id === selectedCalc)?.name}\n\n${calculationMemory}\n\nResultado: ${resultText}\n\nhttps://pablo-finance.vercel.app/login`;
                    
                    try {
                      window.focus();
                      if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                        toast.success('Copiado para a área de transferência!');
                      } else {
                        throw new Error('Clipboard API not available');
                      }
                    } catch (err) {
                      // Fallback using a hidden textarea
                      const textArea = document.createElement("textarea");
                      textArea.value = text;
                      textArea.style.position = "fixed";
                      textArea.style.left = "-999999px";
                      textArea.style.top = "-999999px";
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        toast.success('Copiado para a área de transferência!');
                      } catch (copyErr) {
                        console.error('Fallback copy failed:', copyErr);
                        toast.error('Erro ao copiar. Por favor, tente novamente.');
                      }
                      document.body.removeChild(textArea);
                    }
                  }}
                >
                  <Copy className="w-4 h-4" /> Copiar
                </Button>
                <Button 
                  className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" /> Compartilhar
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" className="w-full rounded-xl" onClick={handleClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CalculationShareDialog 
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        calcName={calculators.find(c => c.id === selectedCalc)?.name || ''}
        memory={calculationMemory || ''}
        result={resultText || ''}
      />
    </div>
  );
};
