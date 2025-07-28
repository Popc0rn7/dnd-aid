import React, { useState } from 'react';

// 怪物状态枚举
const STATUS_OPTIONS = ['正常', '濒死', '眩晕', '中毒', '隐身'];

function getDefaultMonster() {
  return { name: '', hp: 10, status: ['正常'], initiativeBonus: 0 };
}
function getDefaultPlayer() {
  return { name: '', initiative: 10 };
}

function BattleAssistant() {
  // 战斗设置弹窗相关状态
  const [showSetup, setShowSetup] = useState(true);
  const [monsterInputs, setMonsterInputs] = useState([{ ...getDefaultMonster() }]);
  const [playerInputs, setPlayerInputs] = useState([{ ...getDefaultPlayer() }]);
  const [combatants, setCombatants] = useState([]);
  // 在组件顶部state中添加批量怪物输入相关状态
  const [batchMonster, setBatchMonster] = useState({ name: '', hp: 10, initiativeBonus: 0, count: 1 });

  // 添加怪物/玩家输入行
  const addMonsterInput = () => setMonsterInputs(inputs => [...inputs, { ...getDefaultMonster() }]);
  const addPlayerInput = () => setPlayerInputs(inputs => [...inputs, { ...getDefaultPlayer() }]);

  // 批量添加怪物函数
  const batchAddMonsters = () => {
    if (!batchMonster.name || batchMonster.count < 1) return;
    setMonsterInputs(inputs => [
      ...inputs,
      ...Array.from({ length: batchMonster.count }, (_, i) => ({
        name: batchMonster.count > 1 ? `${batchMonster.name}${i + 1}` : batchMonster.name,
        hp: batchMonster.hp,
        status: ['正常'],
        initiativeBonus: batchMonster.initiativeBonus,
      }))
    ]);
    setBatchMonster({ name: '', hp: 10, initiativeBonus: 0, count: 1 });
  };

  // 修改输入内容
  const updateMonsterInput = (idx, field, value) => {
    setMonsterInputs(inputs => inputs.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const updatePlayerInput = (idx, field, value) => {
    setPlayerInputs(inputs => inputs.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // 开始战斗，生成战斗参与者
  // roll 1d20
  function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  const startBattle = () => {
    let id = 1;
    const monsters = monsterInputs
      .filter(m => m.name)
      .map(m => {
        const roll = rollD20();
        const initiative = roll + Number(m.initiativeBonus);
        return {
          id: id++,
          name: m.name,
          hp: Number(m.hp),
          maxHp: Number(m.hp),
          status: ['正常'],
          initiative,
          initiativeRoll: `${roll} + ${m.initiativeBonus} = ${initiative}`,
          type: 'monster',
        };
      });
    const players = playerInputs
      .filter(p => p.name)
      .map(p => ({ ...p, id: id++, type: 'player', status: [], hp: undefined, maxHp: undefined, initiative: Number(p.initiative) }));
    setCombatants([...monsters, ...players]);
    setShowSetup(false);
  };

  // 按先攻排序
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  // 怪物血量调整
  const changeHp = (id, delta) => {
    setCombatants(list =>
      list.map(c =>
        c.id === id && c.type === 'monster'
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) }
          : c
      )
    );
  };

  // 怪物状态切换
  const toggleStatus = (id, status) => {
    setCombatants(list =>
      list.map(c => {
        if (c.id !== id || c.type !== 'monster') return c;
        const hasStatus = c.status.includes(status);
        return {
          ...c,
          status: hasStatus
            ? c.status.filter(s => s !== status)
            : [...c.status, status],
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-10 px-2">
      <h2 className="text-4xl font-extrabold text-center mb-4 text-blue-700 dark:text-blue-300 drop-shadow">DND 5e 战斗助手</h2>
      <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-8">快速设置怪物和玩家，自动生成先攻顺序，实时管理血量与状态。</p>
      {showSetup ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto mb-8 border border-blue-100 dark:border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-blue-500 dark:text-blue-300">战斗设置</h3>
          <div className="mb-8">
            <h4 className="font-bold mb-3 text-gray-700 dark:text-gray-200">怪物列表</h4>
            {/* 在怪物输入区上方增加批量添加区和说明 */}
            <div className="flex flex-wrap gap-3 mb-4 items-end bg-blue-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">怪物名称</label>
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-32 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" placeholder="如 哥布林" value={batchMonster.name} onChange={e => setBatchMonster(b => ({ ...b, name: e.target.value }))} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">血量（最大HP）</label>
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" min={1} value={batchMonster.hp} onChange={e => setBatchMonster(b => ({ ...b, hp: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">先攻加值</label>
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-20 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" value={batchMonster.initiativeBonus} onChange={e => setBatchMonster(b => ({ ...b, initiativeBonus: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">数量</label>
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-16 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" min={1} value={batchMonster.count} onChange={e => setBatchMonster(b => ({ ...b, count: Number(e.target.value) }))} />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold shadow transition" onClick={batchAddMonsters}>批量添加怪物</button>
              <span className="text-xs text-gray-500 ml-2">如输入“哥布林”+3，自动添加“哥布林1、哥布林2、哥布林3”</span>
            </div>
            {monsterInputs.map((m, idx) => (
              <div key={idx} className="flex gap-3 mb-2 items-end">
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-40 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" placeholder="怪物名称" value={m.name} onChange={e => updateMonsterInput(idx, 'name', e.target.value)} />
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-24 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" placeholder="血量" value={m.hp} min={1} onChange={e => updateMonsterInput(idx, 'hp', Number(e.target.value))} />
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-28 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-300 outline-none transition" type="number" placeholder="先攻加值" value={m.initiativeBonus} onChange={e => updateMonsterInput(idx, 'initiativeBonus', e.target.value)} />
                <span className="text-xs text-gray-400">单独编辑可覆盖批量添加内容</span>
              </div>
            ))}
            <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 mt-2 shadow transition font-semibold" onClick={addMonsterInput}>添加怪物</button>
          </div>
          <div className="mb-8">
            <h4 className="font-bold mb-3 text-gray-700 dark:text-gray-200">玩家列表</h4>
            {playerInputs.map((p, idx) => (
              <div key={idx} className="flex gap-3 mb-2">
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-40 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-300 outline-none transition" placeholder="玩家名称" value={p.name} onChange={e => updatePlayerInput(idx, 'name', e.target.value)} />
                <input className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-28 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-300 outline-none transition" type="number" placeholder="先攻" value={p.initiative} onChange={e => updatePlayerInput(idx, 'initiative', Number(e.target.value))} />
              </div>
            ))}
            <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 mt-2 shadow transition font-semibold" onClick={addPlayerInput}>添加玩家</button>
          </div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-6 py-3 mt-4 w-full shadow-lg text-lg transition" onClick={startBattle}>开始战斗</button>
        </div>
      ) : (
        <div className="overflow-x-auto max-w-4xl mx-auto">
          <table className="min-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-blue-100 dark:border-gray-700">
            <thead>
              <tr className="bg-blue-100 dark:bg-gray-700">
                <th className="py-3 px-4 text-left text-lg font-bold">先攻</th>
                <th className="py-3 px-4 text-left text-lg font-bold">名称</th>
                <th className="py-3 px-4 text-left text-lg font-bold">类型</th>
                <th className="py-3 px-4 text-left text-lg font-bold">血量</th>
                <th className="py-3 px-4 text-left text-lg font-bold">先攻结果</th>
                <th className="py-3 px-4 text-left text-lg font-bold">状态</th>
                <th className="py-3 px-4 text-left text-lg font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedCombatants.map(c => (
                <tr key={c.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                  <td className="py-2 px-4 font-bold text-blue-700 dark:text-blue-300 text-lg">{c.initiative}</td>
                  <td className="py-2 px-4 text-base">{c.name}</td>
                  <td className="py-2 px-4 text-base">{c.type === 'monster' ? '怪物' : '玩家'}</td>
                  <td className="py-2 px-4">
                    {c.type === 'monster' ? (
                      <div className="flex items-center gap-2">
                        <button className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 py-1 shadow" onClick={() => changeHp(c.id, -1)}>-</button>
                        <span className="font-mono text-lg">{c.hp} / {c.maxHp}</span>
                        <button className="bg-green-500 hover:bg-green-600 text-white rounded-full px-3 py-1 shadow" onClick={() => changeHp(c.id, 1)}>+</button>
                      </div>
                    ) : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="py-2 px-4">
                    {c.type === 'monster' ? (
                      <span className="text-purple-700 dark:text-purple-300 font-mono">{c.initiativeRoll}</span>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-200 font-mono">{c.initiative}</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {c.type === 'monster' ? (
                      <div className="flex flex-wrap gap-1">
                        {STATUS_OPTIONS.map(status => (
                          <button
                            key={status}
                            className={`px-2 py-1 rounded text-xs font-semibold border transition shadow-sm ${c.status.includes(status) ? 'bg-blue-400 text-white border-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-200 dark:hover:bg-blue-600'}`}
                            onClick={() => toggleStatus(c.id, status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-2">
                      {/* 这里可以添加更多操作按钮 */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BattleAssistant;
